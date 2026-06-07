"use client";

import { useState } from "react";
import TaskRow from "../components/TaskRow";
import { DEFAULT_COLUMN_ORDER } from "../components/columns";
import type { Task, TaskPatch } from "@/lib/types";

const SEED: Task = {
  id: "smoke-1",
  title: "Sample task",
  description: null,
  status: "not_started",
  priority: 2,
  assignee: null,
  due_date: null,
  completed: false,
  category: "ops",
  slack_item_id: null,
  position: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  last_synced_at: null,
};

// Renders the real TaskRow with mock data so the e2e test exercises the
// production component (TitleCell keydown handling), not a re-implementation.
export default function SmokeClient() {
  const [task, setTask] = useState<Task>(SEED);
  return (
    <main className="mx-auto max-w-7xl p-8">
      <div className="overflow-hidden rounded-xl border border-line bg-panel">
        <TaskRow
          task={task}
          today="2026-01-01"
          team={[]}
          columnOrder={DEFAULT_COLUMN_ORDER}
          onPatch={(patch: TaskPatch) =>
            setTask((t) => ({ ...t, ...patch }) as Task)
          }
          onDelete={() => {}}
        />
      </div>
    </main>
  );
}
