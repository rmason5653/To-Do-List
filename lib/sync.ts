import {
  createListItem,
  fetchListItems,
  getListSchema,
  parseItem,
  slackEnabled,
  updateListItem,
  type ParsedItem,
  type SlackColumn,
} from "./slack";
import {
  createTask,
  getTask,
  listTasks,
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

    const slackItems = await fetchListItems();
    const dbTasks = await listTasks();

    const bySlackId = new Map<string, Task>();
    const unlinkedOpsByTitle = new Map<string, Task>();
    for (const t of dbTasks) {
      if (t.slack_item_id) bySlackId.set(t.slack_item_id, t);
      else if (t.category === "ops") unlinkedOpsByTitle.set(t.title.trim(), t);
    }

    let pulled = 0;
    let pushed = 0;

    // --- Slack -> app -------------------------------------------------------
    for (const raw of slackItems) {
      const item = parseItem(raw, schema);
      if (!item.id || !item.title) continue;

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

    const status: SyncStatus = {
      ok: true,
      ranAt,
      message:
        pulled || pushed
          ? `Synced — ${pulled} in from Slack, ${pushed} out to Slack.`
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
