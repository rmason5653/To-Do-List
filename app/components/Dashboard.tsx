"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuickAdd from "./QuickAdd";
import TaskRow from "./TaskRow";
import { AssigneePicker } from "./Assignee";
import {
  COLUMNS,
  DEFAULT_COLUMN_ORDER,
  gridTemplate,
  loadColumnOrder,
  reorderColumns,
  saveColumnOrder,
  type ColumnId,
} from "./columns";
import { groupByPriority, groupByTime, isDone, todayISO } from "@/lib/grouping";
import type {
  RecurrenceMap,
  SyncStatus,
  Task,
  TaskInput,
  TaskPatch,
  TeamMember,
} from "@/lib/types";

type Filter = "all" | "ops" | "personal";
type Grouping = "time" | "priority";

function mergeTask(t: Task, patch: TaskPatch): Task {
  const next = { ...t, ...patch } as Task;
  if (patch.completed === true) next.status = "done";
  if (patch.completed === false && next.status === "done") next.status = "not_started";
  if (patch.status === "done") next.completed = true;
  if (patch.status && patch.status !== "done") next.completed = false;
  return next;
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <div className={`text-2xl font-bold ${tone}`}>{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-line bg-panel2 p-0.5 text-xs font-semibold">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 capitalize transition ${
            value === o.id ? "bg-mason-red text-white" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? "" : "-rotate-90"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Grip() {
  return (
    <svg
      viewBox="0 0 8 14"
      className="h-3 w-2 shrink-0 text-line"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="2" cy="3" r="1" />
      <circle cx="6" cy="3" r="1" />
      <circle cx="2" cy="7" r="1" />
      <circle cx="6" cy="7" r="1" />
      <circle cx="2" cy="11" r="1" />
      <circle cx="6" cy="11" r="1" />
    </svg>
  );
}

export default function Dashboard({
  initialTasks,
  initialSync,
  initialTeam,
  initialRecurrence,
  loadError,
}: {
  initialTasks: Task[];
  initialSync: SyncStatus | null;
  initialTeam: TeamMember[];
  initialRecurrence: RecurrenceMap;
  loadError: string | null;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [sync, setSync] = useState<SyncStatus | null>(initialSync);
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [recurrence, setRecurrence] = useState<RecurrenceMap>(initialRecurrence);
  const [filter, setFilter] = useState<Filter>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [grouping, setGrouping] = useState<Grouping>("time");
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(["done"]));
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(DEFAULT_COLUMN_ORDER);
  const [dragOverCol, setDragOverCol] = useState<ColumnId | null>(null);
  const dragCol = useRef<ColumnId | null>(null);
  const busy = useRef(0);

  const today = todayISO();

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("light") ? "light" : "dark",
    );
    setColumnOrder(loadColumnOrder());
    try {
      const g = localStorage.getItem("todo_grouping");
      if (g === "time" || g === "priority") setGrouping(g);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("light", next === "light");
      try {
        localStorage.setItem("todo_theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const changeGrouping = useCallback((g: Grouping) => {
    setGrouping(g);
    try {
      localStorage.setItem("todo_grouping", g);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleColumnDrop = useCallback((target: ColumnId) => {
    const dragged = dragCol.current;
    dragCol.current = null;
    setDragOverCol(null);
    if (!dragged) return;
    setColumnOrder((prev) => {
      const next = reorderColumns(prev, dragged, target);
      saveColumnOrder(next);
      return next;
    });
  }, []);

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
      if (data.recurrence) setRecurrence(data.recurrence);
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

  const patchTask = useCallback(async (id: string, patch: TaskPatch) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? mergeTask(t, patch) : t)));
    if (patch.recurrence !== undefined) {
      setRecurrence((prev) => {
        const next = { ...prev };
        if (patch.recurrence) next[id] = patch.recurrence;
        else delete next[id];
        return next;
      });
    }
    busy.current += 1;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => {
          const replaced = prev.map((t) => (t.id === id ? data.task : t));
          return data.spawned ? [...replaced, data.spawned] : replaced;
        });
        if (data.recurrence) setRecurrence(data.recurrence);
      }
    } finally {
      busy.current -= 1;
    }
  }, []);

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

  const groups = useMemo(
    () => (grouping === "time" ? groupByTime(filtered, today) : groupByPriority(filtered)),
    [grouping, filtered, today],
  );

  const stats = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let open = 0;
    let doneToday = 0;
    for (const t of filtered) {
      if (isDone(t)) {
        if (t.updated_at.slice(0, 10) === today) doneToday += 1;
        continue;
      }
      open += 1;
      if (t.due_date && t.due_date < today) overdue += 1;
      else if (t.due_date === today) dueToday += 1;
    }
    return { overdue, dueToday, open, doneToday };
  }, [filtered, today]);

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-line bg-panel p-8">
          <h1 className="text-lg font-bold text-ink">Finish the setup</h1>
          <p className="mt-2 text-sm text-muted">The app could not reach its database:</p>
          <pre className="mt-2 overflow-auto rounded-lg bg-panel2 p-3 text-xs text-mason-red">
            {loadError}
          </pre>
          <p className="mt-4 text-xs text-muted">
            Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then redeploy. Full
            instructions are in the project README.
          </p>
        </div>
      </main>
    );
  }

  const syncTone = !sync ? "text-muted" : sync.ok ? "text-emerald-400" : "text-mason-red";

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            OPS <span className="text-mason-red">TO-DO</span>
          </h1>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Mason Homes · {dateLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${syncTone}`}>
            {syncing ? "Syncing…" : sync ? sync.message : "Standalone mode"}
          </span>
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="rounded-lg border border-mason-red px-3 py-1.5 text-xs font-bold text-mason-red transition hover:bg-mason-red hover:text-white disabled:opacity-50"
          >
            Sync now
          </button>
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:text-ink"
            title="Toggle theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Overdue" value={stats.overdue} tone="text-mason-red" />
        <StatTile label="Due today" value={stats.dueToday} tone="text-mason-yellow" />
        <StatTile label="Completed today" value={stats.doneToday} tone="text-emerald-400" />
        <StatTile label="Open total" value={stats.open} tone="text-ink" />
      </div>

      <div className="mb-4">
        <QuickAdd
          defaultCategory={filter === "personal" ? "personal" : "ops"}
          team={team}
          onAdd={addTask}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segmented<Filter>
          options={[
            { id: "all", label: "all" },
            { id: "ops", label: "ops" },
            { id: "personal", label: "personal" },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <Segmented<Grouping>
          options={[
            { id: "time", label: "by time" },
            { id: "priority", label: "by priority" },
          ]}
          value={grouping}
          onChange={changeGrouping}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tasks…"
          className="field min-w-[9rem] flex-1"
        />
        {team.length > 0 && (
          <AssigneePicker
            team={team}
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            unassignedLabel="Anyone"
          />
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-line bg-panel p-8 text-center">
          <p className="text-sm text-muted">
            No tasks yet. Add one above
            {sync?.slackConfigured
              ? ' or hit "Sync now" to import your Slack Ops List.'
              : "."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-panel">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div
                className="grid items-center gap-2 border-b border-line px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted"
                style={{ gridTemplateColumns: gridTemplate(columnOrder) }}
              >
                <span />
                {columnOrder.map((id) => (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => {
                      dragCol.current = id;
                    }}
                    onDragEnd={() => {
                      dragCol.current = null;
                      setDragOverCol(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverCol !== id) setDragOverCol(id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleColumnDrop(id);
                    }}
                    title="Drag to reorder this column"
                    className={`flex cursor-grab select-none items-center gap-1 transition-colors ${
                      dragOverCol === id ? "text-mason-red" : "hover:text-ink"
                    }`}
                  >
                    <Grip />
                    {COLUMNS[id].label}
                  </div>
                ))}
              </div>

              {groups.every((g) => g.tasks.length === 0) ? (
                <p className="px-3 py-8 text-center text-sm text-muted">
                  No tasks match these filters.
                </p>
              ) : (
                groups.map((g) =>
                  g.tasks.length === 0 ? null : (
                    <div key={g.id}>
                      <button
                        onClick={() => toggleCollapsed(g.id)}
                        className="flex w-full items-center gap-2 border-b border-line bg-panel2 px-3 py-1.5"
                      >
                        <Chevron open={!collapsed.has(g.id)} />
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink">
                          {g.title}
                        </span>
                        <span className="rounded-full border border-line bg-panel px-1.5 py-0.5 text-[10px] font-medium text-muted">
                          {g.tasks.length}
                        </span>
                      </button>
                      {!collapsed.has(g.id) &&
                        g.tasks.map((t) => (
                          <TaskRow
                            key={t.id}
                            task={t}
                            today={today}
                            team={team}
                            columnOrder={columnOrder}
                            recurrence={recurrence[t.id]}
                            onPatch={(patch) => patchTask(t.id, patch)}
                            onDelete={() => removeTask(t.id)}
                          />
                        ))}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 text-center text-xs text-muted">
        Ops tasks sync with Slack · Personal tasks stay private to this app
      </footer>
    </main>
  );
}
