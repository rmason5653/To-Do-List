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
    <div className="rounded-xl bg-white p-2 ring-1 ring-black/5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Add a task and press Enter…"
          className="min-w-[12rem] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
          {(["ops", "personal"] as Category[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-md px-3 py-1.5 capitalize transition ${
                category === c
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500"
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
          className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-600 outline-none focus:border-indigo-400"
        />
        <button
          onClick={submit}
          disabled={busy || !title.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
