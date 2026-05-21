import {
  createListItem,
  deleteListItem,
  fetchListItems,
  fetchWorkspaceUsers,
  getListSchema,
  parseItem,
  slackEnabled,
  updateListItem,
  type ParsedItem,
  type SlackColumn,
} from "./slack";
import { getTeamRecord, setTeam } from "./team";
import {
  addSlackTombstone,
  createTask,
  deleteTask,
  getSlackTombstones,
  getTask,
  listTasks,
  setSlackTombstones,
  setSyncStatus,
  updateTask,
} from "./tasks";
import type { SyncStatus, Task } from "./types";

function differs(task: Task, item: ParsedItem): boolean {
  return (
    task.title.trim() !== item.title.trim() ||
    (task.description ?? "") !== (item.description ?? "") ||
    task.status !== item.status ||
    (task.priority ?? null) !== (item.priority ?? null) ||
    (task.assignee ?? "") !== (item.assignee ?? "") ||
    (task.due_date ?? "") !== (item.due_date ?? "") ||
    task.completed !== item.completed
  );
}

/** A task has un-pushed local edits when it changed after its last sync. */
function pendingLocal(task: Task): boolean {
  return task.last_synced_at == null || task.updated_at > task.last_synced_at;
}

const TEAM_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Keep the workspace directory fresh so assignee ids resolve to names.
 * Throttled to once every few hours and non-fatal — a failure here (e.g. a
 * missing users:read scope) must never block the task sync.
 */
async function refreshTeam(): Promise<void> {
  try {
    const record = await getTeamRecord();
    const ageMs = record ? Date.now() - Date.parse(record.updatedAt) : Infinity;
    if (ageMs < TEAM_TTL_MS) return;
    const users = await fetchWorkspaceUsers();
    if (users.length) await setTeam(users);
  } catch {
    // Names just won't refresh this run.
  }
}

/**
 * Full two-way reconciliation between the app database and the Slack List.
 * Tool-side edits also push immediately via pushTaskToSlack(); this catches
 * everything else (Slack-side edits, retries, first-run import).
 */
export async function runSync(): Promise<SyncStatus> {
  const ranAt = new Date().toISOString();

  if (!slackEnabled()) {
    const status: SyncStatus = {
      ok: true,
      ranAt,
      message: "Slack not connected — running as a standalone to-do app.",
      pulled: 0,
      pushed: 0,
      slackConfigured: false,
    };
    await setSyncStatus(status);
    return status;
  }

  try {
    const schema = await getListSchema();
    if (!schema.length) {
      throw new Error(
        "Could not read the Slack List columns. Check SLACK_LIST_ID and that the token has lists:read.",
      );
    }

    await refreshTeam();

    const slackItems = await fetchListItems();
    const dbTasks = await listTasks();

    const bySlackId = new Map<string, Task>();
    const unlinkedOpsByTitle = new Map<string, Task>();
    for (const t of dbTasks) {
      if (t.slack_item_id) bySlackId.set(t.slack_item_id, t);
      else if (t.category === "ops") unlinkedOpsByTitle.set(t.title.trim(), t);
    }

    const tombstones = new Set(await getSlackTombstones());
    const clearedTombstones = new Set<string>();
    const seenSlackIds = new Set<string>();

    let pulled = 0;
    let pushed = 0;
    let deletedLocal = 0;
    let deletedSlack = 0;

    // --- Slack -> app -------------------------------------------------------
    for (const raw of slackItems) {
      const item = parseItem(raw, schema);
      if (!item.id) continue;
      seenSlackIds.add(item.id);

      // A row the app already deleted: drop it from Slack, never re-import.
      if (tombstones.has(item.id)) {
        try {
          await deleteListItem(item.id);
          clearedTombstones.add(item.id);
          deletedSlack += 1;
        } catch {
          // Keep the tombstone; the next sync retries the delete.
        }
        continue;
      }

      if (!item.title) continue;

      let task = bySlackId.get(item.id);

      // Link a Slack row to an existing app task with the same title.
      if (!task) {
        const match = unlinkedOpsByTitle.get(item.title.trim());
        if (match) {
          task = await updateTask(match.id, {
            slack_item_id: item.id,
            last_synced_at: ranAt,
          });
          unlinkedOpsByTitle.delete(item.title.trim());
        }
      }

      // Brand new Slack row -> import it.
      if (!task) {
        await createTask({
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          assignee: item.assignee,
          due_date: item.due_date,
          completed: item.completed,
          category: "ops",
          slack_item_id: item.id,
          last_synced_at: ranAt,
        });
        pulled += 1;
        continue;
      }

      // Linked row: local edits win and push; otherwise accept Slack's values.
      if (pendingLocal(task)) {
        await updateListItem(item.id, task, schema);
        await updateTask(task.id, { last_synced_at: ranAt });
        pushed += 1;
      } else if (differs(task, item)) {
        await updateTask(task.id, {
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          assignee: item.assignee,
          due_date: item.due_date,
          completed: item.completed,
          last_synced_at: ranAt,
        });
        pulled += 1;
      }
    }

    // --- App -> Slack: ops tasks that never made it to the List -------------
    for (const task of unlinkedOpsByTitle.values()) {
      const newId = await createListItem(task, schema);
      if (newId) {
        await updateTask(task.id, {
          slack_item_id: newId,
          last_synced_at: ranAt,
        });
        pushed += 1;
      }
    }

    // --- Slack -> app deletions --------------------------------------------
    // A linked task whose Slack row is gone was deleted in Slack. Skipped when
    // the List came back empty, so a transient empty response cannot wipe
    // every task at once.
    if (slackItems.length > 0) {
      for (const [slackId, task] of bySlackId) {
        if (seenSlackIds.has(slackId)) continue;
        await deleteTask(task.id);
        deletedLocal += 1;
      }
    }

    // Retire tombstones whose Slack row is now gone; keep the rest to retry.
    const finalTombstones = [...tombstones].filter(
      (id) => !clearedTombstones.has(id) && seenSlackIds.has(id),
    );
    if (finalTombstones.length !== tombstones.size) {
      await setSlackTombstones(finalTombstones);
    }

    const summary: string[] = [];
    if (pulled) summary.push(`${pulled} in from Slack`);
    if (pushed) summary.push(`${pushed} out to Slack`);
    if (deletedLocal) summary.push(`${deletedLocal} removed here`);
    if (deletedSlack) summary.push(`${deletedSlack} removed in Slack`);

    const status: SyncStatus = {
      ok: true,
      ranAt,
      message: summary.length
        ? `Synced — ${summary.join(", ")}.`
        : "Up to date with Slack.",
      pulled,
      pushed,
      slackConfigured: true,
    };
    await setSyncStatus(status);
    return status;
  } catch (err) {
    const status: SyncStatus = {
      ok: false,
      ranAt,
      message: `Slack sync failed: ${(err as Error).message}`,
      pulled: 0,
      pushed: 0,
      slackConfigured: true,
    };
    await setSyncStatus(status);
    return status;
  }
}

/**
 * Push a single task to Slack right after it is edited in the app, so changes
 * appear in the Slack List immediately instead of waiting for the next poll.
 * Failures are swallowed here; runSync() retries because last_synced_at is
 * only advanced on success.
 */
export async function pushTaskToSlack(taskId: string): Promise<void> {
  if (!slackEnabled()) return;

  const task = await getTask(taskId);
  if (!task || task.category !== "ops") return;

  let schema: SlackColumn[];
  try {
    schema = await getListSchema();
  } catch {
    return;
  }
  if (!schema.length) return;

  const now = new Date().toISOString();
  if (task.slack_item_id) {
    await updateListItem(task.slack_item_id, task, schema);
    await updateTask(task.id, { last_synced_at: now });
  } else {
    const newId = await createListItem(task, schema);
    if (newId) {
      await updateTask(task.id, { slack_item_id: newId, last_synced_at: now });
    }
  }
}

/**
 * Remove a task's row from the Slack List after the task is deleted in the app.
 * The id is tombstoned first, so a failed delete is retried by runSync() rather
 * than re-importing the orphaned row as a brand new task on the next poll.
 */
export async function deleteTaskFromSlack(slackItemId: string): Promise<void> {
  if (!slackEnabled()) return;

  await addSlackTombstone(slackItemId);
  try {
    await deleteListItem(slackItemId);
  } catch {
    // Tombstone retained; runSync() retries the delete and then clears it.
  }
}
