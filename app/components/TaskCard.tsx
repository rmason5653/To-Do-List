"use client";

import { useEffect, useState } from "react";
import { dueLabel } from "@/lib/grouping";
import type { Status, Task, TaskInput } from "@/lib/types";

// Priority is stored as a number (higher = more urgent). We present it as words
// + a color rank so it stays glanceable and avoids the inverted "P0 vs P3"
// confusion. Storage and sort order are untouched.
const PRIORITY: Record<number, { label: string; dot: string; rail: string }> = {
  3: { label: "Urgent", dot: "bg-red", rail: "bg-red" },
  2: { label: "High", dot: "bg-gold", rail: "bg-gold" },
  1: { label: "Medium", dot: "bg-steel", rail: "bg-steel/60" },
  0: { label: "Low", dot: "bg-ink-faint", rail: "bg-ink-faint" },
};

const STATUS_LABEL: Record<Status, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "No priority" },
  { value: "3", label: "Urgent" },
  { value: "2", label: "High" },
  { value: "1", label: "Medium" },
  { value: "0", label: "Low" },
];

function initials(value: string): string {
  const name = value.includes("@") ? value.split("@")[0] : value;
  const parts = name.split(/[.\s_-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
}

const inputClass =
  "w-full rounded-control border border-line-strong bg-surface-3 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-red";

const selectClass =
  "rounded-control border border-line-strong bg-surface-3 px-2 py-2 text-sm text-ink-primary outline-none focus:border-red";

const fieldLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.06em] text-steel";

function Chip({
  children,
  dot,
  tone = "neutral",
}: {
  children: React.ReactNode;
  dot?: string;
  tone?: "neutral" | "alarm";
}) {
  const base =
    tone === "alarm"
      ? "bg-red-subtle text-bone border-[rgba(226,6,2,.35)]"
      : "bg-surface-3 text-ink-secondary border-line";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${base}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {children}
    </span>
  );
}

export default function TaskCard({
  task,
  today,
  onPatch,
  onDelete,
}: {
  task: Task;
  today: string;
  onPatch: (patch: Partial<TaskInput>) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);
  useEffect(() => {
    setDescription(task.description ?? "");
  }, [task.description]);

  const done = task.completed || task.status === "done";
  const overdue = !done && task.due_date && task.due_date < today;
  const priority =
    task.priority != null ? PRIORITY[task.priority] : undefined;

  return (
    <div
      className={`group relative overflow-hidden rounded-card border border-line bg-surface-2 shadow-e1 transition duration-150 ease-out hover:-translate-y-px hover:bg-surface-3 hover:shadow-e2 ${
        done ? "opacity-70" : ""
      }`}
    >
      {/* Priority rail — glanceable urgency down the left edge. */}
      {priority && !done && (
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-1 ${priority.rail}`}
        />
      )}

      <div className="flex items-start gap-3 p-4 pl-5">
        <button
          aria-label={done ? "Mark not done" : "Mark done"}
          onClick={() => onPatch({ completed: !done })}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition duration-150 ease-out ${
            done
              ? "border-green bg-green text-bone"
              : "border-steel hover:border-green"
          }`}
        >
          {done && (
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M7.6 13.2 4.4 10l-1.1 1.1 4.3 4.3 9-9L15.5 5.3z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="block w-full rounded-sm text-left"
          >
            <span
              className={`text-[15px] font-semibold leading-snug ${
                done ? "text-ink-muted line-through" : "text-ink-primary"
              }`}
            >
              {task.title || "Untitled task"}
            </span>
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {priority && <Chip dot={priority.dot}>{priority.label}</Chip>}
            {task.category === "personal" && <Chip>Personal</Chip>}
            {!done && task.status === "in_progress" && (
              <Chip dot="bg-gold">In progress</Chip>
            )}
            {task.due_date && (
              <Chip tone={overdue ? "alarm" : "neutral"}>
                {dueLabel(task.due_date, today)}
              </Chip>
            )}
            {task.assignee && (
              <span
                title={task.assignee}
                className="inline-flex items-center rounded-full border border-line bg-surface-3 px-2 py-0.5 text-[11px] font-semibold text-ink-secondary"
              >
                {initials(task.assignee)}
              </span>
            )}
            {task.description && !expanded && (
              <span className="truncate text-[11px] text-ink-faint">
                {task.description.replace(/\s+/g, " ").slice(0, 80)}
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-line p-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title.trim() !== task.title) {
                onPatch({ title: title.trim() });
              }
            }}
            placeholder="Task title"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== (task.description ?? "")) {
                onPatch({ description: description || null });
              }
            }}
            placeholder="Notes / details"
            rows={2}
            className={`mt-2 resize-y ${inputClass}`}
          />

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="flex flex-col gap-1.5">
              <span className={fieldLabelClass}>Status</span>
              <select
                value={task.status}
                onChange={(e) => onPatch({ status: e.target.value as Status })}
                className={selectClass}
              >
                {(["not_started", "in_progress", "done"] as Status[]).map(
                  (s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={fieldLabelClass}>Priority</span>
              <select
                value={task.priority ?? ""}
                onChange={(e) =>
                  onPatch({
                    priority:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className={selectClass}
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={fieldLabelClass}>Due date</span>
              <input
                type="date"
                value={task.due_date ?? ""}
                onChange={(e) => onPatch({ due_date: e.target.value || null })}
                className={selectClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={fieldLabelClass}>List</span>
              <select
                value={task.category}
                onChange={(e) =>
                  onPatch({ category: e.target.value as Task["category"] })
                }
                className={selectClass}
              >
                <option value="ops">Ops</option>
                <option value="personal">Personal</option>
              </select>
            </label>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              defaultValue={task.assignee ?? ""}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v !== (task.assignee ?? "")) onPatch({ assignee: v || null });
              }}
              placeholder="Assignee (name or email)"
              className={inputClass}
            />
            {/* Destructive = red, per brand (red is red, no separate danger hue). */}
            <button
              onClick={() => {
                if (confirm("Delete this task?")) onDelete();
              }}
              className="shrink-0 rounded-control px-3 py-2 text-sm font-medium text-red transition duration-150 ease-out hover:bg-red-subtle"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
