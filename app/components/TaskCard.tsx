"use client";

import { useEffect, useState } from "react";
import { dueLabel } from "@/lib/grouping";
import { AssigneePicker, AssigneeTag } from "./Assignee";
import type { Status, Task, TaskInput, TeamMember } from "@/lib/types";

const PRIORITY_STYLE: Record<number, string> = {
  3: "bg-rose-100 text-rose-700",
  2: "bg-amber-100 text-amber-700",
  1: "bg-sky-100 text-sky-700",
  0: "bg-slate-100 text-slate-600",
};

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

export default function TaskCard({
  task,
  today,
  team,
  onPatch,
  onDelete,
}: {
  task: Task;
  today: string;
  team: TeamMember[];
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
  const assigneeMember = task.assignee
    ? team.find((m) => m.id === task.assignee)
    : undefined;

  return (
    <div className="rounded-xl bg-white ring-1 ring-black/5 transition hover:ring-black/10">
      <div className="flex items-start gap-3 p-3">
        <button
          aria-label={done ? "Mark not done" : "Mark done"}
          onClick={() => onPatch({ completed: !done })}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
            done
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-slate-300 hover:border-emerald-500"
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
            className="block w-full text-left"
          >
            <span
              className={`text-sm leading-snug ${
                done ? "text-slate-400 line-through" : "text-slate-800"
              }`}
            >
              {task.title || "Untitled task"}
            </span>
          </button>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {task.category === "personal" && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                Personal
              </span>
            )}
            {task.priority != null && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  PRIORITY_STYLE[task.priority] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                P{task.priority}
              </span>
            )}
            {!done && task.status === "in_progress" && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                In progress
              </span>
            )}
            {task.due_date && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  overdue
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {dueLabel(task.due_date, today)}
              </span>
            )}
            {assigneeMember ? (
              <AssigneeTag member={assigneeMember} />
            ) : task.assignee ? (
              <span
                title={task.assignee}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
              >
                {initials(task.assignee)}
              </span>
            ) : null}
            {task.description && !expanded && (
              <span className="truncate text-[11px] text-slate-400">
                {task.description.replace(/\s+/g, " ").slice(0, 80)}
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim() && title.trim() !== task.title) {
                onPatch({ title: title.trim() });
              }
            }}
            placeholder="Task title"
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
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
            className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
          />

          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">Status</span>
              <select
                value={task.status}
                onChange={(e) => onPatch({ status: e.target.value as Status })}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              >
                {(["not_started", "in_progress", "done"] as Status[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">Priority</span>
              <select
                value={task.priority ?? ""}
                onChange={(e) =>
                  onPatch({
                    priority: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              >
                <option value="">None</option>
                <option value="3">P3</option>
                <option value="2">P2</option>
                <option value="1">P1</option>
                <option value="0">P0</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">Due date</span>
              <input
                type="date"
                value={task.due_date ?? ""}
                onChange={(e) => onPatch({ due_date: e.target.value || null })}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">List</span>
              <select
                value={task.category}
                onChange={(e) =>
                  onPatch({ category: e.target.value as Task["category"] })
                }
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              >
                <option value="ops">Ops</option>
                <option value="personal">Personal</option>
              </select>
            </label>
          </div>

          <div className="mt-2 flex items-end gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[11px] font-medium text-slate-500">
                Assignee
              </span>
              <AssigneePicker
                team={team}
                value={task.assignee}
                onChange={(id) => onPatch({ assignee: id })}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
              />
            </label>
            <button
              onClick={() => {
                if (confirm("Delete this task?")) onDelete();
              }}
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
