"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  in_progress: "border-mason-gold/30 bg-mason-gold/10 text-mason-gold",
  done: "border-mason-green/40 bg-mason-green/15 text-mason-green",
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
      className={`cursor-pointer appearance-none rounded-md border px-1.5 py-1 text-center text-[11px] font-semibold uppercase tracking-wide outline-none ${STATUS_STYLE[status]}`}
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

function CheckGlyph() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
      <path d="M7.6 13.2 4.4 10l-1.1 1.1 4.3 4.3 9-9L15.5 5.3z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
    </svg>
  );
}

const DASHED_CHIP =
  "rounded-full border border-dashed border-line px-2 py-0.5 text-[11px] text-muted transition hover:text-ink";

/** The task-title editor: a textarea that grows to fit its content, so a long
 *  title wraps onto extra lines and the row extends instead of clipping. */
function TitleCell({
  title,
  done,
  recurrence,
  reminder,
  onChange,
  onCommit,
}: {
  title: string;
  done: boolean;
  recurrence?: Recurrence;
  reminder?: boolean;
  onChange: (value: string) => void;
  onCommit: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // Re-fit on content change and when the column width changes (window resize).
  useEffect(() => {
    resize();
  }, [title, resize]);

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return (
    <div className="flex w-full min-w-0 items-start gap-1.5">
      <textarea
        ref={ref}
        value={title}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          // Plain Enter inserts a line break; Cmd/Ctrl+Enter saves and exits.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        placeholder="Untitled task"
        className={`min-w-0 flex-1 resize-none overflow-hidden rounded border-0 bg-transparent px-1 py-0.5 text-sm outline-none focus:bg-canvas ${
          done ? "text-muted line-through" : "text-ink"
        }`}
      />
      {recurrence && (
        <span
          className="mt-1 shrink-0 text-muted"
          title={`Repeats — ${RECURRENCE_LABEL[recurrence]}`}
        >
          <RepeatIcon />
        </span>
      )}
      {reminder && (
        <span className="mt-1 shrink-0 text-muted" title="Slack reminder on">
          <BellIcon />
        </span>
      )}
    </div>
  );
}

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
      <TitleCell
        title={title}
        done={done}
        recurrence={recurrence}
        reminder={reminder}
        onChange={setTitle}
        onCommit={commitTitle}
      />
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
        className={`hit-area flex transition hover:text-mason-red ${
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
          // Overdue reads like an alarm, not just tinted text.
          <span
            className={`flex items-center gap-1 text-[11px] font-medium ${
              overdue
                ? "rounded-full border border-mason-red/35 bg-mason-red/10 px-2 py-0.5 text-mason-red"
                : "text-muted"
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
      className={`hit-area flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition active:scale-90 ${
        done
          ? "border-mason-green bg-mason-green text-bone"
          : "border-line hover:border-mason-green"
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
      className={`hit-area flex transition hover:text-ink ${
        expandMode === "more" ? "text-ink" : "text-muted"
      }`}
    >
      <MoreIcon />
    </button>
  );

  // Glanceable urgency: a left-edge rail colored by star level (3 red, 2 gold,
  // 1 steel) on open tasks, so priority scans without reading the row.
  const rail =
    !done && task.priority
      ? task.priority >= 3
        ? "bg-mason-red"
        : task.priority === 2
          ? "bg-mason-gold"
          : "bg-muted"
      : null;

  // Swipe gestures (touch only) on the mobile card: right = toggle done,
  // left = delete (with Undo at the list level). overflow-hidden on the
  // wrapper clips the drag so it can never cause horizontal page scroll.
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const swipe = useRef({ x: 0, y: 0, active: false, decided: false, horiz: false });
  const SWIPE_TRIGGER = 96;

  function onSwipeStart(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return; // desktop uses the row buttons
    swipe.current = {
      x: e.clientX,
      y: e.clientY,
      active: true,
      decided: false,
      horiz: false,
    };
  }
  function onSwipeMove(e: React.PointerEvent) {
    const s = swipe.current;
    if (!s.active) return;
    const moveX = e.clientX - s.x;
    const moveY = e.clientY - s.y;
    if (!s.decided) {
      if (Math.abs(moveX) < 10 && Math.abs(moveY) < 10) return; // movement threshold
      s.decided = true;
      s.horiz = Math.abs(moveX) > Math.abs(moveY); // horizontal intent vs scroll
      if (s.horiz) {
        setDragging(true);
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      }
    }
    if (s.horiz) setDx(Math.max(-140, Math.min(140, moveX)));
  }
  function onSwipeEnd() {
    const s = swipe.current;
    if (s.horiz) {
      setDragging(false);
      if (dx >= SWIPE_TRIGGER) onPatch({ completed: !done });
      else if (dx <= -SWIPE_TRIGGER) onDelete();
      setDx(0);
    }
    s.active = false;
    s.decided = false;
    s.horiz = false;
  }
  const swipeBg = dx > 0 ? "bg-mason-green/15" : dx < 0 ? "bg-mason-red/15" : "";

  return (
    <div className="relative border-b border-line last:border-b-0">
      {rail && (
        <span
          aria-hidden
          className={`absolute inset-y-0 left-0 hidden w-[3px] sm:block ${rail}`}
        />
      )}

      {/* Desktop: an aligned grid row */}
      <div
        className={`hidden items-center gap-2 px-3 py-3 transition-colors hover:bg-panel2 sm:grid ${
          done ? "opacity-70 hover:opacity-100" : ""
        }`}
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

      {/* Mobile: a swipeable stacked card — swipe right = done, left = delete */}
      <div className="relative overflow-hidden sm:hidden">
        {dx !== 0 && (
          <div
            aria-hidden
            className={`absolute inset-0 flex items-center px-5 ${swipeBg}`}
          >
            {dx > 0 ? (
              <span className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wide text-mason-green">
                <CheckGlyph /> {done ? "Reopen" : "Done"}
              </span>
            ) : (
              <span className="ml-auto flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wide text-mason-red">
                Delete <TrashIcon />
              </span>
            )}
          </div>
        )}
        <div
          onPointerDown={onSwipeStart}
          onPointerMove={onSwipeMove}
          onPointerUp={onSwipeEnd}
          onPointerCancel={onSwipeEnd}
          style={{
            transform: `translateX(${dx}px)`,
            transition: dragging ? "none" : "transform 150ms ease-out",
            touchAction: "pan-y",
          }}
          className={`relative flex items-start gap-3 bg-panel px-3 py-3 ${
            done ? "opacity-70" : ""
          }`}
        >
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
            {/* Undo toast covers mistakes, so no blocking confirm here. */}
            <button
              onClick={onDelete}
              className="rounded-lg px-3 py-2 text-sm font-medium text-mason-red transition hover:bg-mason-red/10 active:brightness-95"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
