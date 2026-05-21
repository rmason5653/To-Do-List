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
