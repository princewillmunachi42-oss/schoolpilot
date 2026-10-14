"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  display_status: string;
  due_date: string | null;
  completion_note: string | null;
  completed_at: string | null;
};

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dateLabel(value: string | null) {
  if (!value) return "No deadline";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

async function readTaskResponse(response: Response): Promise<{
  error?: string;
  tasks?: Task[];
}> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `The server returned an empty response (HTTP ${response.status}). Please try again.`
    );
  }

  try {
    return JSON.parse(text) as { error?: string; tasks?: Task[] };
  } catch {
    throw new Error(
      `The server returned an invalid response (HTTP ${response.status}). Please check the server logs.`
    );
  }
}

export default function TeacherTasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/teacher/tasks", { cache: "no-store" });
      const data = await readTaskResponse(response);
      setError("");
      if (!response.ok) throw new Error(data.error || "Unable to load tasks.");
      setTasks(data.tasks ?? []);
      setNotes(
        Object.fromEntries(
          (data.tasks ?? []).map((t: Task) => [t.id, t.completion_note ?? ""]),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) void load();
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  async function update(task: Task, status: string) {
    setSavingId(task.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/teacher/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status,
          completion_note: notes[task.id] ?? "",
        }),
      });
      const data = await readTaskResponse(response);
      if (!response.ok) throw new Error(data.error || "Unable to update task.");
      setNotice(`"${task.title}" updated successfully.`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update task.");
    } finally {
      setSavingId("");
    }
  }

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.display_status === "pending").length,
    in_progress: tasks.filter((t) => t.display_status === "in_progress").length,
    overdue: tasks.filter((t) => t.display_status === "overdue").length,
    completed: tasks.filter((t) => t.display_status === "completed").length,
  };
  const visible =
    filter === "all" ? tasks : tasks.filter((t) => t.display_status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">My workspace</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            My Tasks
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review assigned responsibilities and report your progress.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {notice}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[
          { key: "all", label: "All tasks", value: counts.all },
          { key: "pending", label: "Pending", value: counts.pending },
          {
            key: "in_progress",
            label: "In progress",
            value: counts.in_progress,
          },
          { key: "overdue", label: "Overdue", value: counts.overdue },
          { key: "completed", label: "Completed", value: counts.completed },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 ${filter === item.key ? "border-primary ring-1 ring-primary/20" : ""}`}
          >
            <p className="text-xs font-medium text-muted-foreground sm:text-sm">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card p-10 text-sm text-muted-foreground">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading your tasks...
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">You&apos;re all caught up</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No tasks match this filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((task) => (
            <article
              key={task.id}
              className="flex min-w-0 flex-col rounded-2xl border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="min-w-0 flex-1 break-words text-lg font-semibold">
                  {task.title}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${task.display_status === "overdue" ? "bg-red-500/10 text-red-700 dark:text-red-300" : task.display_status === "completed" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : task.display_status === "in_progress" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}
                >
                  {label(task.display_status)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-muted px-2.5 py-1">
                  Priority: {label(task.priority)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  Due: {dateLabel(task.due_date)}
                </span>
              </div>
              {task.description && (
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                  {task.description}
                </p>
              )}

              <div className="mt-5 border-t pt-4">
                <label className="block space-y-1.5 text-sm font-medium">
                  Progress / completion note
                  <textarea
                    rows={3}
                    maxLength={5000}
                    value={notes[task.id] ?? ""}
                    onChange={(e) =>
                      setNotes((current) => ({
                        ...current,
                        [task.id]: e.target.value,
                      }))
                    }
                    placeholder="Describe progress, blockers, or what you completed..."
                    className="w-full resize-y rounded-xl border bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"
                  />
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {task.status !== "in_progress" &&
                    task.status !== "completed" && (
                      <button
                        type="button"
                        disabled={!!savingId}
                        onClick={() => void update(task, "in_progress")}
                        className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {savingId === task.id ? "Saving..." : "Start task"}
                      </button>
                    )}
                  {task.status !== "completed" && (
                    <button
                      type="button"
                      disabled={!!savingId}
                      onClick={() => void update(task, "completed")}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {savingId === task.id ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      Mark completed
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!!savingId}
                    onClick={() => void update(task, task.status)}
                    className="rounded-xl border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                  >
                    Save note
                  </button>
                </div>
                {task.completed_at && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Completed on{" "}
                    {new Date(task.completed_at).toLocaleDateString()}.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
