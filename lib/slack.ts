import type { Status, Task } from "./types";

/**
 * Slack Lists integration.
 *
 * Reads/writes the native Slack List that backs the Ops List. The Slack Lists
 * Web API is relatively new, so the request/response shapes are handled
 * defensively here and every value extraction tolerates several formats.
 * If a future Slack API tweak breaks a call, the failure is captured by the
 * sync engine and surfaced in the app's sync bar rather than crashing.
 */

const API = "https://slack.com/api";

export function slackEnabled(): boolean {
  return Boolean(process.env.SLACK_TOKEN && process.env.SLACK_LIST_ID);
}

function token(): string {
  return process.env.SLACK_TOKEN as string;
}

function listId(): string {
  return process.env.SLACK_LIST_ID as string;
}

/** Build a descriptive error, including Slack's per-field detail when present. */
function slackError(method: string, status: number, json: any): Error {
  const messages = json?.response_metadata?.messages;
  const detail =
    Array.isArray(messages) && messages.length ? ` — ${messages.join("; ")}` : "";
  return new Error(`Slack ${method}: ${json?.error || `HTTP ${status}`}${detail}`);
}

async function callJson(method: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) {
    throw slackError(method, res.status, json);
  }
  return json;
}

async function callForm(method: string, params: Record<string, string>): Promise<any> {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) {
    throw slackError(method, res.status, json);
  }
  return json;
}

// --- Schema -----------------------------------------------------------------

export interface SlackColumn {
  id: string;
  name: string;
  type: string;
  options: { id: string; label: string }[];
}

/** Field name -> the Slack column names it may map to (case-insensitive). */
const FIELD_ALIASES: Record<string, string[]> = {
  title: ["task", "name", "title"],
  status: ["status"],
  priority: ["priority"],
  description: ["description", "notes"],
  assignee: ["assignee", "owner", "assigned to"],
  due_date: ["due date", "due", "deadline"],
  completed: ["completed", "done", "complete"],
};

export async function getListSchema(): Promise<SlackColumn[]> {
  const json = await callForm("files.info", { file: listId() });
  const file = json.file ?? {};
  const raw: any[] =
    file.list_metadata?.schema ??
    file.list_metadata?.columns ??
    file.schema ??
    file.columns ??
    [];

  return raw.map((c: any) => {
    const optionSource =
      c.options?.choices ?? c.options ?? c.select?.options ?? c.choices ?? [];
    return {
      id: c.id ?? c.key ?? c.column_id ?? "",
      name: String(c.name ?? c.title ?? c.label ?? ""),
      type: String(c.type ?? c.format ?? "text"),
      options: (Array.isArray(optionSource) ? optionSource : []).map((o: any) => ({
        id: String(o.id ?? o.value ?? o.key ?? ""),
        label: String(o.label ?? o.text ?? o.name ?? o.value ?? ""),
      })),
    };
  });
}

export function findColumn(
  schema: SlackColumn[],
  field: keyof typeof FIELD_ALIASES,
): SlackColumn | undefined {
  const aliases = FIELD_ALIASES[field];
  return schema.find((c) => aliases.includes(c.name.trim().toLowerCase()));
}

// --- Users ------------------------------------------------------------------

export interface SlackUser {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
}

/**
 * Active human members of the workspace. Used to resolve the assignee column
 * (a Slack Person column whose cells are user ids) into real names.
 */
export async function fetchWorkspaceUsers(): Promise<SlackUser[]> {
  const users: SlackUser[] = [];
  let cursor: string | undefined;
  let guard = 0;
  do {
    const params: Record<string, string> = { limit: "200" };
    if (cursor) params.cursor = cursor;
    const json = await callForm("users.list", params);
    for (const m of json.members ?? []) {
      if (!m || m.deleted || m.is_bot || m.id === "USLACKBOT") continue;
      const profile = m.profile ?? {};
      users.push({
        id: String(m.id),
        name: String(
          profile.real_name || profile.display_name || m.real_name || m.name || m.id,
        ),
        email: profile.email ? String(profile.email) : null,
        avatar: profile.image_72 || profile.image_48 || null,
      });
    }
    cursor = json.response_metadata?.next_cursor || undefined;
    guard += 1;
  } while (cursor && guard < 25);
  return users;
}

// --- Reading items ----------------------------------------------------------

export interface ParsedItem {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: number | null;
  assignee: string | null;
  due_date: string | null;
  completed: boolean;
}

export async function fetchListItems(): Promise<any[]> {
  const items: any[] = [];
  let cursor: string | undefined;
  let guard = 0;
  do {
    const body: Record<string, unknown> = { list_id: listId(), limit: 100 };
    if (cursor) body.cursor = cursor;
    const json = await callJson("slackLists.items.list", body);
    for (const it of json.items ?? json.records ?? []) items.push(it);
    cursor = json.response_metadata?.next_cursor || undefined;
    guard += 1;
  } while (cursor && guard < 50);
  return items;
}

/** Pull the raw cells of an item into a column-id -> cell map. */
function cellMap(item: any): Map<string, any> {
  const map = new Map<string, any>();
  const cells: any[] = item.fields ?? item.cells ?? item.row ?? [];
  for (const cell of cells) {
    const key = cell.column_id ?? cell.key ?? cell.column ?? cell.id;
    if (key) map.set(String(key), cell);
  }
  return map;
}

function cellText(cell: any): string {
  if (cell == null) return "";
  if (typeof cell.text === "string") return cell.text;
  if (typeof cell.value === "string") return cell.value;
  if (typeof cell.string === "string") return cell.string;
  if (Array.isArray(cell.rich_text)) {
    return cell.rich_text.map((r: any) => r.text ?? "").join("");
  }
  if (typeof cell.rich_text === "string") return cell.rich_text;
  return "";
}

function cellBool(cell: any): boolean {
  if (cell == null) return false;
  const v = cell.checkbox ?? cell.value ?? cell.boolean;
  return v === true || v === "true" || v === 1;
}

function cellNumber(cell: any): number | null {
  if (cell == null) return null;
  const v = cell.number ?? cell.value;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
}

function cellDate(cell: any): string | null {
  if (cell == null) return null;
  let v = cell.date ?? cell.value ?? cell.timestamp;
  if (Array.isArray(v)) v = v[0];
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    return new Date(ms).toISOString().slice(0, 10);
  }
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString().slice(0, 10);
}

function cellSelectLabels(cell: any, column?: SlackColumn): string[] {
  if (cell == null) return [];
  let raw = cell.select ?? cell.options ?? cell.value;
  if (raw == null) return [];
  if (!Array.isArray(raw)) raw = [raw];
  return raw
    .map((entry: any) => {
      const id = typeof entry === "object" ? entry.id ?? entry.value : entry;
      const opt = column?.options.find((o) => o.id === String(id));
      if (opt) return opt.label;
      if (typeof entry === "object") return entry.label ?? entry.text ?? "";
      return String(entry);
    })
    .filter(Boolean);
}

const USER_ID = /^[UW][A-Z0-9]{6,}$/;

/** Slack user ids referenced by a Person cell. */
function cellUsers(cell: any): string[] {
  if (cell == null) return [];
  let raw =
    cell.user ?? cell.users ?? cell.people ?? cell.select ?? cell.options ?? cell.value;
  if (raw == null) return [];
  if (!Array.isArray(raw)) raw = [raw];
  return raw
    .map((u: any) => (typeof u === "object" && u ? u.id ?? u.user ?? u.value : u))
    .filter((u: any) => typeof u === "string" && USER_ID.test(u));
}

function statusFromLabel(label: string): Status {
  const l = label.trim().toLowerCase();
  if (l.includes("progress")) return "in_progress";
  if (l === "done" || l.includes("complete")) return "done";
  return "not_started";
}

export function parseItem(item: any, schema: SlackColumn[]): ParsedItem {
  const cells = cellMap(item);
  const get = (field: keyof typeof FIELD_ALIASES) => {
    const col = findColumn(schema, field);
    return col ? { col, cell: cells.get(col.id) } : { col: undefined, cell: undefined };
  };

  const title = get("title");
  const status = get("status");
  const priority = get("priority");
  const description = get("description");
  const assignee = get("assignee");
  const due = get("due_date");
  const completed = get("completed");

  const statusLabels = cellSelectLabels(status.cell, status.col);
  let parsedStatus: Status = statusLabels.length
    ? statusFromLabel(statusLabels[0])
    : "not_started";

  const isCompleted = completed.col ? cellBool(completed.cell) : false;
  if (isCompleted) parsedStatus = "done";

  let parsedPriority: number | null = null;
  if (priority.col) {
    parsedPriority = cellNumber(priority.cell);
    if (parsedPriority == null) {
      const labels = cellSelectLabels(priority.cell, priority.col);
      const n = labels.length ? parseInt(labels[0], 10) : NaN;
      parsedPriority = Number.isNaN(n) ? null : n;
    }
  }

  return {
    id: String(item.id ?? item.item_id ?? item.row_id ?? ""),
    title: cellText(title.cell).trim(),
    description: description.col ? cellText(description.cell).trim() || null : null,
    status: parsedStatus,
    priority: parsedPriority,
    assignee: assignee.col
      ? cellUsers(assignee.cell)[0] ||
        cellText(assignee.cell).trim() ||
        cellSelectLabels(assignee.cell, assignee.col)[0] ||
        null
      : null,
    due_date: due.col ? cellDate(due.cell) : null,
    completed: isCompleted || parsedStatus === "done",
  };
}

// --- Writing items ----------------------------------------------------------

function statusLabel(status: Status): string {
  if (status === "in_progress") return "In progress";
  if (status === "done") return "Done";
  return "Not started";
}

function optionIdForLabel(column: SlackColumn, label: string): string | undefined {
  const target = label.trim().toLowerCase();
  return column.options.find((o) => o.label.trim().toLowerCase() === target)?.id;
}

/** A plain string as a Block Kit rich_text value for a List text cell. */
function richTextValue(value: string): unknown[] {
  if (!value) return [];
  return [
    {
      type: "rich_text",
      elements: [
        {
          type: "rich_text_section",
          elements: [{ type: "text", text: value }],
        },
      ],
    },
  ];
}

/**
 * Build the cell payload for a create/update call. Value shapes follow the
 * Slack Lists API: text columns take Block Kit rich_text; date, number and
 * select columns take arrays; checkbox takes a boolean; person columns take
 * an array of user ids.
 */
function buildCells(task: Task, schema: SlackColumn[]): Record<string, unknown>[] {
  const cells: Record<string, unknown>[] = [];

  const push = (
    field: keyof typeof FIELD_ALIASES,
    build: (col: SlackColumn) => Record<string, unknown> | null,
  ) => {
    const col = findColumn(schema, field);
    if (!col) return;
    const payload = build(col);
    if (payload) cells.push({ column_id: col.id, ...payload });
  };

  push("title", () => ({ rich_text: richTextValue(task.title) }));

  push("description", () => ({
    rich_text: richTextValue(task.description ?? ""),
  }));

  push("status", (col) => {
    if (col.type.includes("select") || col.options.length) {
      const id = optionIdForLabel(col, statusLabel(task.status));
      return id ? { select: [id] } : { rich_text: richTextValue(statusLabel(task.status)) };
    }
    return { rich_text: richTextValue(statusLabel(task.status)) };
  });

  push("priority", (col) => {
    const t = col.type.toLowerCase();
    // The Ops List "Priority" is a rating column — it takes a rating array.
    if (t.includes("rating")) {
      return { rating: task.priority == null ? [] : [task.priority] };
    }
    if (t.includes("select") || col.options.length) {
      if (task.priority == null) return { select: [] };
      const id = optionIdForLabel(col, String(task.priority));
      return id ? { select: [id] } : null;
    }
    return { number: task.priority == null ? [] : [task.priority] };
  });

  push("completed", () => ({ checkbox: task.completed }));

  push("due_date", () => ({ date: task.due_date ? [task.due_date] : [] }));

  push("assignee", (col) => {
    const value = task.assignee?.trim() || "";
    const isUserId = USER_ID.test(value);
    const t = col.type.toLowerCase();
    const isUserCol =
      t.includes("user") ||
      t.includes("person") ||
      t.includes("people") ||
      t.includes("assignee");
    if (isUserCol || isUserId) {
      // A Person cell takes an array of user ids; an empty array clears it.
      return { user: isUserId ? [value] : [] };
    }
    return { rich_text: richTextValue(value) };
  });

  return cells;
}

export async function createListItem(task: Task, schema: SlackColumn[]): Promise<string> {
  const json = await callJson("slackLists.items.create", {
    list_id: listId(),
    initial_fields: buildCells(task, schema),
  });
  const item = json.item ?? json.record ?? json;
  return String(item.id ?? item.item_id ?? "");
}

export async function updateListItem(
  itemId: string,
  task: Task,
  schema: SlackColumn[],
): Promise<void> {
  // slackLists.items.update identifies the row by row_id on each cell.
  const cells = buildCells(task, schema).map((cell) => ({
    ...cell,
    row_id: itemId,
  }));
  await callJson("slackLists.items.update", {
    list_id: listId(),
    cells,
  });
}

export async function deleteListItem(itemId: string): Promise<void> {
  await callJson("slackLists.items.delete", {
    list_id: listId(),
    id: itemId,
  });
}

// --- Messaging --------------------------------------------------------------

/** DM a Slack user. `userId` works directly as the channel for chat.postMessage. */
export async function sendDirectMessage(
  userId: string,
  text: string,
): Promise<void> {
  await callJson("chat.postMessage", { channel: userId, text });
}
