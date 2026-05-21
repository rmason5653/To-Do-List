// Table column model — order is user-draggable and persisted to localStorage.

export type ColumnId = "task" | "status" | "priority" | "notes" | "assignee" | "due";

export interface ColumnDef {
  id: ColumnId;
  label: string;
  width: string; // a CSS grid track size
}

export const COLUMNS: Record<ColumnId, ColumnDef> = {
  task: { id: "task", label: "Task", width: "minmax(11rem,1fr)" },
  status: { id: "status", label: "Status", width: "7rem" },
  priority: { id: "priority", label: "Priority", width: "5.5rem" },
  notes: { id: "notes", label: "Notes", width: "4.25rem" },
  assignee: { id: "assignee", label: "Assignee", width: "9rem" },
  due: { id: "due", label: "Due date", width: "7rem" },
};

export const DEFAULT_COLUMN_ORDER: ColumnId[] = [
  "task",
  "status",
  "priority",
  "notes",
  "assignee",
  "due",
];

const CHECKBOX_WIDTH = "1.75rem";
const STORAGE_KEY = "todo_columns";

/** CSS grid-template-columns: the fixed checkbox column plus the data columns. */
export function gridTemplate(order: ColumnId[]): string {
  return [CHECKBOX_WIDTH, ...order.map((id) => COLUMNS[id].width)].join(" ");
}

/** Read the saved column order, falling back to the default if missing or stale. */
export function loadColumnOrder(): ColumnId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const valid =
        Array.isArray(parsed) &&
        parsed.length === DEFAULT_COLUMN_ORDER.length &&
        DEFAULT_COLUMN_ORDER.every((id) => parsed.includes(id));
      if (valid) return parsed as ColumnId[];
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_COLUMN_ORDER;
}

export function saveColumnOrder(order: ColumnId[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

/** Move `dragged` into the slot currently held by `target`. */
export function reorderColumns(
  order: ColumnId[],
  dragged: ColumnId,
  target: ColumnId,
): ColumnId[] {
  if (dragged === target) return order;
  const next = order.filter((id) => id !== dragged);
  next.splice(next.indexOf(target), 0, dragged);
  return next;
}
