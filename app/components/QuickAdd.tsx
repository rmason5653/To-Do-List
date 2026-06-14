"use client";

import { useState } from "react";
import { AssigneePicker } from "./Assignee";
import PriorityStars from "./PriorityStars";
import type { Category, TaskInput, TeamMember } from "@/lib/types";

export default function QuickAdd({
  defaultCategory,
  team,
  onAdd,
}: {
  defaultCategory: Category;
  team: TeamMember[];
  onAdd: (input: TaskInput) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [priority, setPriority] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Parse the YYYY-MM-DD value as a *local* date (not UTC) so the label never
  // shows the day before in negative-offset timezones.
  function formatDue(value: string) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onAdd({
        title: trimmed,
        category,
        due_date: due || null,
        assignee,
        priority,
        status: "not_started",
      });
      setTitle("");
      setDue("");
      setAssignee(null);
      setPriority(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel p-2 shadow-e1">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Add a task and press Enter…"
        className="field min-w-[12rem] flex-1 basis-full sm:basis-auto"
      />
      <div className="flex rounded-lg border border-line bg-panel2 p-0.5 text-xs font-semibold">
        {(["ops", "personal"] as Category[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-md px-3 py-1.5 font-display capitalize transition ${
              category === c ? "bg-mason-red text-bone" : "text-muted hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {/* Native date placeholders are invisible/inconsistent on iOS Safari, so
          we hide the native text (.date-native) and render our own label here. */}
      <div className="relative">
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date"
          className="field date-native w-full min-w-[8rem]"
        />
        <span
          className={`pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm ${
            due ? "text-ink" : "text-muted"
          }`}
        >
          {due ? formatDue(due) : "Due date"}
        </span>
      </div>
      <div
        className="flex items-center rounded-lg border border-line bg-panel2 px-2.5 py-2"
        title="Priority"
      >
        <PriorityStars priority={priority} onChange={setPriority} />
      </div>
      {team.length > 0 && (
        <AssigneePicker team={team} value={assignee} onChange={setAssignee} />
      )}
      <button
        onClick={submit}
        disabled={busy || !title.trim()}
        className="grow rounded-lg bg-mason-red px-4 py-2 font-display text-sm font-bold text-bone transition hover:bg-mason-red-hover hover:opacity-100 active:brightness-95 disabled:opacity-50 sm:grow-0"
      >
        Add
      </button>
    </div>
  );
}
