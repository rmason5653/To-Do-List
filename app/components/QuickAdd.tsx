"use client";

import { useState } from "react";
import type { Category, TaskInput } from "@/lib/types";

export default function QuickAdd({
  defaultCategory,
  onAdd,
}: {
  defaultCategory: Category;
  onAdd: (input: TaskInput) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onAdd({
        title: trimmed,
        category,
        due_date: due || null,
        status: "not_started",
      });
      setTitle("");
      setDue("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-card border border-line bg-surface-2 p-2 shadow-e1">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Add a task and press Enter…"
          className="min-w-[12rem] flex-1 rounded-control border border-line-strong bg-surface-3 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-red"
        />

        <div className="flex rounded-control bg-surface-1 p-0.5 text-xs font-medium">
          {(["ops", "personal"] as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-[4px] px-3 py-1.5 capitalize transition duration-150 ease-out ${
                category === c
                  ? "bg-surface-4 text-ink-primary shadow-e1"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="rounded-control border border-line-strong bg-surface-3 px-2 py-2 text-sm text-ink-secondary outline-none focus:border-red"
        />

        {/* Primary CTA — red, bone text, Montserrat. */}
        <button
          onClick={submit}
          disabled={busy || !title.trim()}
          className="rounded-control bg-red px-4 py-2 font-display text-sm font-bold text-bone transition duration-150 ease-out hover:bg-red-hover active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
