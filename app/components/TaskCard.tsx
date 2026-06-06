"use client";

import { useEffect, useState } from "react";
import { dueLabel } from "@/lib/grouping";
import type { Status, Task, TaskInput } from "@/lib/types";

// Priority is a 1–3 star rating that lives in Slack (more stars = more urgent).
// We render it as stars to mirror Slack exactly; the stored number and the
// two-way sync are never touched.
const MAX_STARS = 3;

function priorityRail(value: number): string {
  return value >= 3 ? "bg-red" : value === 2 ? "bg-gold" : "bg-steel/60";
}

function starColor(value: number): string {
  return value >= 3 ? "text-red" : value === 2 ? "text-gold" : "text-ink-secondary";
}

const STATUS_LABEL: Record<Status, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

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

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className={className}>
      <path d="M10 1.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.88l-5.2 2.73.99-5.79L1.58 7.72l5.82-.85L10 1.6z" />
    </svg>
  );
}

// Read-only star meter shown on the card — count = the Slack star rating.
function StarMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(MAX_STARS, value));
  const color = starColor(v);
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Priority ${v} of ${MAX_STARS} stars`}
      title={`Priority: ${v}/${MAX_STARS} stars`}
    >
      {Array.from({ length: MAX_STARS }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < v ? color : "text-ink-faint"}`}
        />
      ))}
    </span>
  );
}

// Interactive star picker in the editor. Writes the same 1–3 number back via
// onPatch, which the existing sync pushes to Slack unchanged.
function StarPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  const v = value ?? 0;
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Priority">
      <span className="flex items-center gap-0.5">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`Set priority to ${n} star${n > 1 ? "s" : ""}`}
            aria-pressed={v === n}
            onClick={() => onChange(n === v ? null : n)}
            className="rounded-sm p-0.5 transition duration-150 ease-out hover:scale-110"
          >
            <Star
              className={`h-5 w-5 ${
                n <= v ? starColor(v) : "text-ink-faint"
              }`}
            />
          </button>
        ))}
      </span>
      {v > 0 && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[11px] font-medium uppercase tracking-[0.06em] text-steel transition hover:text-ink-secondary"
        >
          Clear
        </button>
      )}
    </div>
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
  const stars =
    task.priority != null && task.priority > 0
      ? Math.min(MAX_STARS, task.priority)
      : 0;

  return (
    <div
      className={`group relative overflow-hidden rounded-card border border-line bg-surface-2 shadow-e1 transition duration-150 ease-out hover:-translate-y-px hover:bg-surface-3 hover:shadow-e2 ${
        done ? "opacity-70" : ""
      }`}
    >
      {/* Priority rail — glanceable urgency down the left edge. */}
      {stars > 0 && !done && (
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 w-1 ${priorityRail(stars)}`}
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
            {stars > 0 && <StarMeter value={stars} />}
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

            {/* Star rating mirrors the Slack 1–3 star column (display + edit). */}
            <div className="flex flex-col gap-1.5">
              <span className={fieldLabelClass}>Priority</span>
              <div className="flex min-h-[42px] items-center">
                <StarPicker
                  value={task.priority}
                  onChange={(v) => onPatch({ priority: v })}
                />
              </div>
            </div>

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
