"use client";

import { useState } from "react";
import { AssigneePicker } from "./Assignee";
import PriorityStars from "./PriorityStars";
import { FileChip, PaperclipIcon } from "./Attachments";
import type { Category, Task, TaskInput, TeamMember } from "@/lib/types";

export default function QuickAdd({
  defaultCategory,
  team,
  onAdd,
  onUploadFiles,
}: {
  defaultCategory: Category;
  team: TeamMember[];
  onAdd: (input: TaskInput) => Promise<Task | null> | Task | null | void;
  onUploadFiles?: (taskId: string, files: File[]) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState<string | null>(null);
  const [priority, setPriority] = useState<number | null>(null);
  // Files staged before the task exists. We hold an object URL per image so the
  // preview is stable across re-renders (and revoke them to avoid leaks).
  const [files, setFiles] = useState<{ file: File; preview: string | null }[]>([]);
  const [busy, setBusy] = useState(false);

  function addFiles(picked: File[]) {
    setFiles((prev) => [
      ...prev,
      ...picked.map((file) => ({
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      })),
    ]);
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function clearFiles() {
    setFiles((prev) => {
      for (const p of prev) if (p.preview) URL.revokeObjectURL(p.preview);
      return [];
    });
  }

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
      const task = await onAdd({
        title: trimmed,
        category,
        due_date: due || null,
        assignee,
        priority,
        status: "not_started",
      });
      // Files chosen before the task existed are uploaded once it has an id.
      if (task && files.length > 0 && onUploadFiles) {
        await onUploadFiles(
          task.id,
          files.map((f) => f.file),
        );
      }
      setTitle("");
      setDue("");
      setAssignee(null);
      setPriority(null);
      clearFiles();
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
      {onUploadFiles && (
        <label
          title="Attach images or files"
          className="field flex cursor-pointer items-center gap-1.5 text-muted transition-colors hover:text-mason-red"
        >
          <PaperclipIcon className="h-4 w-4" />
          {files.length > 0 && (
            <span className="text-xs font-semibold text-ink">{files.length}</span>
          )}
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (picked.length) addFiles(picked);
            }}
          />
        </label>
      )}
      <button
        onClick={submit}
        disabled={busy || !title.trim()}
        className="grow rounded-lg bg-mason-red px-4 py-2 font-display text-sm font-bold text-bone transition hover:bg-mason-red-hover hover:opacity-100 active:brightness-95 disabled:opacity-50 sm:grow-0"
      >
        Add
      </button>

      {files.length > 0 && (
        <div className="flex basis-full flex-wrap gap-2 border-t border-line pt-2">
          {files.map((f, i) => (
            <FileChip
              key={`${f.file.name}-${i}`}
              name={f.file.name}
              mime={f.file.type}
              size={f.file.size}
              url={f.preview}
              onRemove={() => removeFile(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
