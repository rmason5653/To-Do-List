"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuickAdd from "./QuickAdd";
import TaskCard from "./TaskCard";
import { groupTasks, isDone, todayISO } from "@/lib/grouping";
import type { Category, SyncStatus, Task, TaskInput } from "@/lib/types";

type Filter = "all" | "ops" | "personal";

function mergeTask(t: Task, patch: Partial<TaskInput>): Task {
  const next = { ...t, ...patch } as Task;
  if (patch.completed === true) next.status = "done";
  if (patch.completed === false && next.status === "done") {
    next.status = "not_started";
  }
  if (patch.status === "done") next.completed = true;
  if (patch.status && patch.status !== "done") next.completed = false;
  return next;
}

function Section({
  title,
  accent,
  tasks,
  today,
  onPatch,
  onDelete,
  collapsible,
}: {
  title: string;
  accent: string;
  tasks: Task[];
  today: string;
  onPatch: (id: string, patch: Partial<TaskInput>) => void;
  onDelete: (id: string) => void;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  if (tasks.length === 0) return null;

  return (
    <section className="mb-7">
      <button
        onClick={() => collapsible && setOpen((v) => !v)}
        className="mb-3 flex w-full items-center gap-2.5"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        <h2 className="font-display text-sm font-bold tracking-tight text-ink-primary">
          {title}
        </h2>
        <span className="tnum rounded-full border border-line bg-surface-3 px-2 py-0.5 text-xs font-semibold text-ink-tertiary">
          {tasks.length}
        </span>
        {collapsible && (
          <span className="ml-1 text-[11px] font-medium uppercase tracking-[0.06em] text-steel">
            {open ? "Hide" : "Show"}
          </span>
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-2.5">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              today={today}
              onPatch={(patch) => onPatch(t.id, patch)}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

const STAT_TONE: Record<string, string> = {
  red: "text-red",
  gold: "text-gold",
  green: "text-green",
  neutral: "text-ink-primary",
};

function StatTile({
  label,
  value,
  tone,
  alarm,
}: {
  label: string;
  value: number;
  tone: keyof typeof STAT_TONE;
  alarm?: boolean;
}) {
  // Overdue reads like an alarm only when it is actually firing.
  const shell =
    alarm && value > 0
      ? "border-[rgba(226,6,2,.35)] bg-red-subtle"
      : "border-line bg-surface-2";
  return (
    <div className={`rounded-card border p-4 shadow-e1 ${shell}`}>
      <div
        className={`tnum font-display text-2xl font-extrabold tracking-[-0.03em] ${STAT_TONE[tone]}`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-steel">
        {label}
      </div>
    </div>
  );
}

export default function Dashboard({
  initialTasks,
  initialSync,
  loadError,
}: {
  initialTasks: Task[];
  initialSync: SyncStatus | null;
  loadError: string | null;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sync, setSync] = useState<SyncStatus | null>(initialSync);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const busy = useRef(0);

  const today = todayISO();

  const refresh = useCallback(async () => {
    if (busy.current > 0) return;
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (busy.current > 0) return;
      setTasks(data.tasks ?? []);
      if (data.sync) setSync(data.sync);
    } catch {
      /* offline; keep current view */
    }
  }, []);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.sync) setSync(data.sync);
      }
    } catch {
      /* ignore */
    } finally {
      setSyncing(false);
      await refresh();
    }
  }, [refresh]);

  useEffect(() => {
    if (loadError) return;
    triggerSync();
    const interval = setInterval(triggerSync, 60_000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTask = useCallback(async (input: TaskInput) => {
    busy.current += 1;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const { task } = await res.json();
        setTasks((prev) => [...prev, task]);
      }
    } finally {
      busy.current -= 1;
    }
  }, []);

  const patchTask = useCallback(
    async (id: string, patch: Partial<TaskInput>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? mergeTask(t, patch) : t)),
      );
      busy.current += 1;
      try {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (res.ok) {
          const { task } = await res.json();
          setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
        }
      } finally {
        busy.current -= 1;
      }
    },
    [],
  );

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    busy.current += 1;
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    } finally {
      busy.current -= 1;
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filter !== "all" && t.category !== filter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [tasks, filter, query]);

  const groups = useMemo(() => groupTasks(filtered, today), [filtered, today]);

  const openCount =
    groups.overdue.length +
    groups.dueToday.length +
    groups.thisWeek.length +
    groups.later.length +
    groups.someday.length;
  const doneToday = filtered.filter(
    (t) => isDone(t) && t.updated_at.slice(0, 10) === today,
  ).length;

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-card border border-line bg-surface-2 p-8 shadow-e2">
          <h1 className="font-display text-lg font-bold text-ink-primary">
            Finish the setup
          </h1>
          <p className="mt-2 text-sm text-ink-tertiary">
            The app could not reach its database:
          </p>
          <pre className="mt-3 overflow-auto rounded-control border border-line bg-surface-1 p-3 text-xs text-red">
            {loadError}
          </pre>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-ink-secondary">
            <li>Create a Supabase project.</li>
            <li>
              Run{" "}
              <code className="text-ink-primary">supabase/schema.sql</code> in
              the Supabase SQL editor.
            </li>
            <li>
              Set <code className="text-ink-primary">SUPABASE_URL</code> and{" "}
              <code className="text-ink-primary">
                SUPABASE_SERVICE_ROLE_KEY
              </code>{" "}
              environment variables, then redeploy.
            </li>
          </ol>
          <p className="mt-4 text-xs text-steel">
            Full instructions are in the project README.
          </p>
        </div>
      </main>
    );
  }

  const syncDot = syncing
    ? "bg-gold"
    : !sync
      ? "bg-steel"
      : sync.ok
        ? "bg-green"
        : "bg-red";

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16">
      <header className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line bg-surface-4/80 px-4 py-4 backdrop-blur">
        <div>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-ink-primary">
            Ops To-Do
          </h1>
          <p className="text-sm text-steel">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            aria-live="polite"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-secondary"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${syncDot} ${
                syncing ? "animate-pulse" : ""
              }`}
            />
            {syncing
              ? "Syncing…"
              : sync
                ? sync.message
                : "Standalone mode"}
          </span>
          {/* Secondary action — utility, subordinate to the red Add CTA. */}
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="rounded-control border border-line-strong px-3 py-1.5 font-display text-xs font-bold text-ink-primary transition duration-150 ease-out hover:bg-bone/5 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sync now
          </button>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile
          label="Overdue"
          value={groups.overdue.length}
          tone="red"
          alarm
        />
        <StatTile label="Due today" value={groups.dueToday.length} tone="gold" />
        <StatTile label="Completed today" value={doneToday} tone="green" />
        <StatTile label="Open total" value={openCount} tone="neutral" />
      </div>

      <div className="mb-5">
        <QuickAdd
          defaultCategory={filter === "personal" ? "personal" : "ops"}
          onAdd={addTask}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="flex rounded-control bg-surface-1 p-0.5 text-xs font-medium">
          {(["all", "ops", "personal"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`rounded-[4px] px-3 py-1.5 capitalize transition duration-150 ease-out ${
                filter === f
                  ? "bg-surface-4 text-ink-primary shadow-e1"
                  : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks…"
          aria-label="Search tasks"
          className="min-w-[10rem] flex-1 rounded-control border border-line-strong bg-surface-3 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted outline-none focus:border-red"
        />
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-card border border-line bg-surface-2 p-12 text-center shadow-e1">
          {/* Display punch — sanctioned empty-state moment (American Captain). */}
          <p className="font-punch text-5xl uppercase tracking-[0.02em] text-bone">
            Nothing queued
          </p>
          <p className="mt-3 text-sm text-ink-tertiary">
            Add a task above
            {sync?.slackConfigured
              ? " or pull your Slack Ops List with “Sync now.”"
              : "."}
          </p>
        </div>
      ) : (
        <>
          <Section
            title="Overdue"
            accent="bg-red"
            tasks={groups.overdue}
            today={today}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="Today"
            accent="bg-gold"
            tasks={groups.dueToday}
            today={today}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="This week"
            accent="bg-ink-secondary"
            tasks={groups.thisWeek}
            today={today}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="Later"
            accent="bg-ink-muted"
            tasks={groups.later}
            today={today}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="Anytime"
            accent="bg-ink-faint"
            tasks={groups.someday}
            today={today}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="Recently done"
            accent="bg-green"
            tasks={groups.done.slice(0, 50)}
            today={today}
            onPatch={patchTask}
            onDelete={removeTask}
            collapsible
          />
        </>
      )}

      <footer className="mt-10 text-center text-xs text-steel">
        Ops tasks sync with Slack · Personal tasks stay private to this app
      </footer>
    </main>
  );
}
