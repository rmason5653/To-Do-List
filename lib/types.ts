export type Status = "not_started" | "in_progress" | "done";
export type Category = "ops" | "personal";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: number | null;
  assignee: string | null;
  due_date: string | null; // YYYY-MM-DD
  completed: boolean;
  category: Category;
  slack_item_id: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
}

export interface TaskInput {
  title: string;
  description?: string | null;
  status?: Status;
  priority?: number | null;
  assignee?: string | null;
  due_date?: string | null;
  completed?: boolean;
  category?: Category;
  slack_item_id?: string | null;
  position?: number;
  last_synced_at?: string | null;
}

export interface SyncStatus {
  ok: boolean;
  ranAt: string | null;
  message: string;
  pulled: number;
  pushed: number;
  slackConfigured: boolean;
}

/** A workspace member who can be tagged as a task assignee. */
export interface TeamMember {
  id: string; // Slack user id (U…/W…)
  name: string;
  email: string | null;
  avatar: string | null;
}

/** How often a task repeats. Stored app-side, keyed by task id. */
export type Recurrence = "daily" | "weekdays" | "weekly" | "biweekly" | "monthly";

export type RecurrenceMap = Record<string, Recurrence>;

/** A task edit, optionally also changing recurrence or the reminder flag. */
export type TaskPatch = Partial<TaskInput> & {
  recurrence?: Recurrence | null;
  reminder?: boolean;
};
