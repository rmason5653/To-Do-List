"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuickAdd from "./QuickAdd";
import TaskCard from "./TaskCard";
import { AssigneePicker } from "./Assignee";
import { groupTasks, isDone, todayISO } from "@/lib/grouping";
import type {
  Category,
  SyncStatus,
  Task,
  TaskInput,
  TeamMember,
} from "@/lib/types";

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
  team,
  onPatch,
  onDelete,
  collapsible,
}: {
  title: string;
  accent: string;
  tasks: Task[];
  today: string;
  team: TeamMember[];
  onPatch: (id: string, patch: Partial<TaskInput>) => void;
  onDelete: (id: string) => void;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  if (tasks.length === 0) return null;

  return (
    <section className="mb-5">
      <button
        onClick={() => collapsible && setOpen((v) => !v)}
        className="mb-2 flex w-full items-center gap-2"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        <h2 className="text-sm font-semibold text-slate-700">{title}</h2>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
          {tasks.length}
        </span>
        {collapsible && (
          <span className="text-xs text-slate-400">{open ? "Hide" : "Show"}</span>
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-2">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              today={today}
              team={team}
              onPatch={(patch) => onPatch(t.id, patch)}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-black/5">
      <div className={`text-2xl font-semibold ${tone}`}>{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

export default function Dashboard({
  initialTasks,
  initialSync,
  initialTeam,
  loadError,
}: {
  initialTasks: Task[];
  initialSync: SyncStatus | null;
  initialTeam: TeamMember[];
  loadError: string | null;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sync, setSync] = useState<SyncStatus | null>(initialSync);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [filter, setFilter] = useState<Filter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
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
      if (data.team) setTeam(data.team);
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
      if (assigneeFilter && t.assignee !== assigneeFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [tasks, filter, assigneeFilter, query]);

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
        <div className="rounded-2xl bg-white p-8 ring-1 ring-black/5">
          <h1 className="text-lg font-semibold text-slate-900">
            Finish the setup
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            The app could not reach its database:
          </p>
          <pre className="mt-2 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-rose-600">
            {loadError}
          </pre>
          <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Create a Supabase project.</li>
            <li>
              Run <code className="text-slate-800">supabase/schema.sql</code> in
              the Supabase SQL editor.
            </li>
            <li>
              Set <code className="text-slate-800">SUPABASE_URL</code> and{" "}
              <code className="text-slate-800">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
              environment variables, then redeploy.
            </li>
          </ol>
          <p className="mt-4 text-xs text-slate-400">
            Full instructions are in the project README.
          </p>
        </div>
      </main>
    );
  }

  const syncTone = !sync
    ? "text-slate-500"
    : sync.ok
      ? "text-emerald-600"
      : "text-rose-600";

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Ops To-Do</h1>
          <p className="text-sm text-slate-500">{dateLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${syncTone}`}>
            {syncing
              ? "Syncing…"
              : sync
                ? sync.message
                : "Standalone mode"}
          </span>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            Sync now
          </button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label="Overdue"
          value={groups.overdue.length}
          tone="text-rose-600"
        />
        <StatTile
          label="Due today"
          value={groups.dueToday.length}
          tone="text-amber-600"
        />
        <StatTile
          label="Completed today"
          value={doneToday}
          tone="text-emerald-600"
        />
        <StatTile label="Open total" value={openCount} tone="text-slate-800" />
      </div>

      <div className="mb-4">
        <QuickAdd
          defaultCategory={filter === "personal" ? "personal" : "ops"}
          team={team}
          onAdd={addTask}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-slate-200 p-0.5 text-xs font-medium">
          {(["all", "ops", "personal"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 capitalize transition ${
                filter === f
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500"
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
          className="min-w-[10rem] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
        />
        {team.length > 0 && (
          <AssigneePicker
            team={team}
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            unassignedLabel="Anyone"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 outline-none focus:border-indigo-400"
          />
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center ring-1 ring-black/5">
          <p className="text-sm text-slate-600">
            No tasks yet. Add one above
            {sync?.slackConfigured
              ? ' or hit "Sync now" to import your Slack Ops List.'
              : "."}
          </p>
        </div>
      ) : (
        <>
          <Section
            title="Overdue"
            accent="bg-rose-500"
            tasks={groups.overdue}
            today={today}
            team={team}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="Today"
            accent="bg-amber-500"
            tasks={groups.dueToday}
            today={today}
            team={team}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="This week"
            accent="bg-sky-500"
            tasks={groups.thisWeek}
            today={today}
            team={team}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="Later"
            accent="bg-indigo-400"
            tasks={groups.later}
            today={today}
            team={team}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="Anytime"
            accent="bg-slate-400"
            tasks={groups.someday}
            today={today}
            team={team}
            onPatch={patchTask}
            onDelete={removeTask}
          />
          <Section
            title="Recently done"
            accent="bg-emerald-500"
            tasks={groups.done.slice(0, 50)}
            today={today}
            team={team}
            onPatch={patchTask}
            onDelete={removeTask}
            collapsible
          />
        </>
      )}

      <footer className="mt-8 text-center text-xs text-slate-400">
        Ops tasks sync with Slack · Personal tasks stay private to this app
      </footer>
    </main>
  );
}
