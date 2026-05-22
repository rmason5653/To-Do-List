"use client";

import { useEffect, useState, type ReactNode } from "react";
import { dueLabel } from "@/lib/grouping";
import { RECURRENCE_LABEL, RECURRENCE_RULES } from "@/lib/recurrence";
import { AssigneePicker, AssigneeTag, memberInitials } from "./Assignee";
import PriorityStars from "./PriorityStars";
import { type ColumnId, gridTemplate } from "./columns";
import type { Recurrence, Status, Task, TaskPatch, TeamMember } from "@/lib/types";

const STATUS_LABEL: Record<Status, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_STYLE: Record<Status, string> = {
  not_started: "border-line bg-panel2 text-muted",
  in_progress: "border-mason-yellow/30 bg-mason-yellow/10 text-mason-yellow",
  done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
};

/** Status shown as a pill that is itself a dropdown — click to change. */
function StatusSelect({
  status,
  onChange,
}: {
  status: Status;
  onChange: (s: Status) => void;
}) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as Status)}
      title="Change status"
      className={`cursor-pointer appearance-none rounded-md border px-1.5 py-1 text-center text-[10px] font-semibold uppercase tracking-wide outline-none ${STATUS_STYLE[status]}`}
    >
      {(["not_started", "in_progress", "done"] as Status[]).map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

function NotesIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M3 4h10M3 8h10M3 12h6" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.6V8l2.4 1.5" strokeLinecap="round" />
    </svg>
  );
}

function RepeatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <circle cx="3" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="13" cy="8" r="1.5" />
    </svg>
  );
}

const DASHED_CHIP =
  "rounded-full border border-dashed border-line px-2 py-0.5 text-[11px] text-muted transition hover:text-ink";

export default function TaskRow({
  task,
  today,
  team,
  columnOrder,
  recurrence,
  reminder,
  onPatch,
  onDelete,
}: {
  task: Task;
  today: string;
  team: TeamMember[];
  columnOrder: ColumnId[];
  recurrence?: Recurrence;
  reminder?: boolean;
  onPatch: (patch: TaskPatch) => void;
  onDelete: () => void;
}) {
  const [expandMode, setExpandMode] = useState<"notes" | "more" | null>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  useEffect(() => setTitle(task.title), [task.title]);
  useEffect(() => setDescription(task.description ?? ""), [task.description]);

  const done = task.completed || task.status === "done";
  const overdue = !done && !!task.due_date && task.due_date < today;
  const member = task.assignee ? team.find((m) => m.id === task.assignee) : undefined;
  const hasNotes = !!task.description && task.description.trim() !== "";

  function commitTitle() {
    const next = title.trim();
    if (!next) {
      setTitle(task.title);
    } else if (next !== task.title) {
      onPatch({ title: next });
    }
  }

  const cells: Record<ColumnId, ReactNode> = {
    task: (
      <div className="flex w-full min-w-0 items-center gap-1.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="Untitled task"
          className={`min-w-0 flex-1 truncate rounded border-0 bg-transparent px-1 py-0.5 text-sm outline-none focus:bg-canvas ${
            done ? "text-muted line-through" : "text-ink"
          }`}
        />
        {recurrence && (
          <span
            className="shrink-0 text-muted"
            title={`Repeats — ${RECURRENCE_LABEL[recurrence]}`}
          >
            <RepeatIcon />
          </span>
        )}
        {reminder && (
          <span className="shrink-0 text-muted" title="Slack reminder on">
            <BellIcon />
          </span>
        )}
      </div>
    ),
    status: (
      <StatusSelect status={task.status} onChange={(s) => onPatch({ status: s })} />
    ),
    priority: (
      <PriorityStars
        priority={task.priority}
        onChange={(p) => onPatch({ priority: p })}
      />
    ),
    notes: (
      <button
        onClick={() => setExpandMode((m) => (m === "notes" ? null : "notes"))}
        title={hasNotes ? "View / edit notes" : "Add notes"}
        className={`flex transition hover:text-mason-red ${
          expandMode === "notes"
            ? "text-mason-red"
            : hasNotes
              ? "text-ink"
              : "text-line"
        }`}
      >
        <NotesIcon />
      </button>
    ),
    assignee: (
      <div className="relative inline-flex">
        {member ? (
          <AssigneeTag member={member} />
        ) : task.assignee ? (
          <span
            title={task.assignee}
            className="rounded-full border border-line bg-panel2 px-2 py-0.5 text-[11px] text-muted"
          >
            {memberInitials(task.assignee)}
          </span>
        ) : (
          <span className={DASHED_CHIP}>+ Assign</span>
        )}
        <AssigneePicker
          team={team}
          value={task.assignee}
          onChange={(id) => onPatch({ assignee: id })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
    ),
    due: (
      <div className="relative inline-flex">
        {task.due_date ? (
          <span
            className={`flex items-center gap-1 text-[11px] font-medium ${
              overdue ? "text-mason-red" : "text-muted"
            }`}
          >
            <ClockIcon />
            {dueLabel(task.due_date, today)}
          </span>
        ) : (
          <span className={DASHED_CHIP}>+ Date</span>
        )}
        <input
          type="date"
          value={task.due_date ?? ""}
          onChange={(e) => onPatch({ due_date: e.target.value || null })}
          onClick={(e) => e.currentTarget.showPicker?.()}
          aria-label="Due date"
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
    ),
  };

  const checkbox = (
    <button
      aria-label={done ? "Mark not done" : "Mark done"}
      onClick={() => onPatch({ completed: !done })}
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
        done
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-line hover:border-emerald-500"
      }`}
    >
      {done && (
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
          <path d="M7.6 13.2 4.4 10l-1.1 1.1 4.3 4.3 9-9L15.5 5.3z" />
        </svg>
      )}
    </button>
  );

  const moreButton = (
    <button
      onClick={() => setExpandMode((m) => (m === "more" ? null : "more"))}
      title="More settings"
      className={`flex transition hover:text-ink ${
        expandMode === "more" ? "text-ink" : "text-muted"
      }`}
    >
      <MoreIcon />
    </button>
  );

  return (
    <div className="border-b border-line last:border-b-0">
      {/* Desktop: an aligned grid row */}
      <div
        className="hidden items-center gap-2 px-3 py-3 transition-colors hover:bg-panel2 sm:grid"
        style={{ gridTemplateColumns: gridTemplate(columnOrder) }}
      >
        {checkbox}
        {columnOrder.map((id) => (
          <div key={id} className="min-w-0">
            {cells[id]}
          </div>
        ))}
        {moreButton}
      </div>

      {/* Mobile: a stacked card */}
      <div className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-panel2 sm:hidden">
        {checkbox}
        <div className="min-w-0 flex-1">
          {cells.task}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {cells.status}
            {cells.priority}
            {cells.assignee}
            {cells.due}
            {cells.notes}
            {moreButton}
          </div>
        </div>
      </div>

      {expandMode === "notes" && (
        <div className="border-t border-line bg-panel2 p-3">
          <textarea
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (description !== (task.description ?? "")) {
                onPatch({ description: description || null });
              }
            }}
            placeholder="Notes / details…"
            rows={3}
            className="field w-full resize-y"
          />
        </div>
      )}

      {expandMode === "more" && (
        <div className="border-t border-line bg-panel2 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                List
              </span>
              <select
                value={task.category}
                onChange={(e) =>
                  onPatch({ category: e.target.value as Task["category"] })
                }
                className="field"
              >
                <option value="ops">Ops</option>
                <option value="personal">Personal</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Repeats
              </span>
              <select
                value={recurrence ?? ""}
                onChange={(e) =>
                  onPatch({
                    recurrence: (e.target.value || null) as Recurrence | null,
                  })
                }
                className="field"
              >
                <option value="">Does not repeat</option>
                {RECURRENCE_RULES.map((r) => (
                  <option key={r} value={r}>
                    {RECURRENCE_LABEL[r]}
                  </option>
                ))}
              </select>
            </label>
            <label
              className="flex items-center gap-2 rounded-lg border border-line bg-panel2 px-3 py-2"
              title="DM the assignee in Slack when this task is due or overdue"
            >
              <input
                type="checkbox"
                checked={!!reminder}
                onChange={(e) => onPatch({ reminder: e.target.checked })}
                className="h-4 w-4 accent-mason-red"
              />
              <span className="whitespace-nowrap text-xs font-medium text-ink">
                Remind in Slack
              </span>
            </label>
            <button
              onClick={() => {
                if (confirm("Delete this task?")) onDelete();
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-mason-red transition hover:bg-mason-red/10"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
