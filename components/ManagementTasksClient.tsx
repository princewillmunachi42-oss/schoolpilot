"use client";


import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, AlertCircle,
  CheckCircle2,
  Clock3,
  ListTodo,
  LoaderCircle,
  Plus,
  RefreshCw,
  Users, } from "lucide-react";

type Teacher = {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  role_title: string | null;
};

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
  created_at: string;
  staff_id: string;
  staff_number: string;
  first_name: string;
  last_name: string;
  role_title: string | null;
};

const priorityStyles: Record<string, string> = {
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  normal: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  high: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-300",
};

const statusStyles: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  overdue: "bg-red-500/10 text-red-700 dark:text-red-300",
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

export default function ManagementTasksClient() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [staffId, setStaffId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [dueDate, setDueDate] = useState("");

  const load = useCallback(async () => {
    try {
      const [taskResponse, teacherResponse] = await Promise.all([
        fetch("/api/school/tasks", { cache: "no-store" }),
        fetch("/api/school/tasks/teachers", { cache: "no-store" }),
      ]);
      const taskData = await taskResponse.json();
      const teacherData = await teacherResponse.json();
      setError("");
      if (!taskResponse.ok)
        throw new Error(taskData.error || "Unable to load tasks.");
      if (!teacherResponse.ok)
        throw new Error(teacherData.error || "Unable to load teachers.");
      setTasks(taskData.tasks ?? []);
      setTeachers(teacherData.teachers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
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

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/school/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          assigned_staff_id: staffId,
          priority,
          due_date: dueDate || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create task.");
      setTitle("");
      setDescription("");
      setStaffId("");
      setPriority("normal");
      setDueDate("");
      setNotice("Task assigned successfully.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create task.");
    } finally {
      setSaving(false);
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
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            People · Accountability
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Teacher Tasks
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Assign responsibilities, track deadlines, and review teacher
            updates.
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
          {
            key: "all",
            label: "Total tasks",
            value: counts.all,
            icon: ListTodo,
          },
          {
            key: "pending",
            label: "Pending",
            value: counts.pending,
            icon: Clock3,
          },
          {
            key: "in_progress",
            label: "In progress",
            value: counts.in_progress,
            icon: Users,
          },
          {
            key: "overdue",
            label: "Overdue",
            value: counts.overdue,
            icon: AlertCircle,
          },
          {
            key: "completed",
            label: "Completed",
            value: counts.completed,
            icon: CheckCircle2,
          },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-2xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 ${filter === item.key ? "border-primary ring-1 ring-primary/20" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                {item.label}
              </span>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold">{item.value}</p>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <form
          onSubmit={createTask}
          className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold">Assign a task</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a responsibility for an active teacher.
            </p>
          </div>

          <label className="block space-y-1.5 text-sm font-medium">
            Task title *
            <input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Submit weekly lesson plans"
              className="w-full rounded-xl border bg-background px-3 py-2.5 font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Assign to teacher *
            <select
              required
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-xl border bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"
            >
              <option value="">Select a teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name} · {t.staff_id}
                  {t.role_title ? ` · ${t.role_title}` : ""}
                </option>
              ))}
            </select>
            {teachers.length === 0 && !loading && (
              <span className="block text-xs text-amber-600">
                No active staff members found.
              </span>
            )}
          </label>

          <label className="block space-y-1.5 text-sm font-medium">
            Description
            <textarea
              rows={4}
              maxLength={10000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions, expected deliverables, or additional context..."
              className="w-full resize-y rounded-xl border bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2.5 font-normal"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">
              Deadline
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full min-w-0 rounded-xl border bg-background px-3 py-2.5 font-normal"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving || teachers.length === 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {saving ? "Assigning..." : "Assign task"}
          </button>
        </form>

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Task register</h2>
              <p className="text-sm text-muted-foreground">
                {visible.length} task{visible.length === 1 ? "" : "s"} ·{" "}
                {label(filter)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card p-10 text-sm text-muted-foreground">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Loading tasks...
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card p-8 text-center">
              <ListTodo className="mx-auto h-9 w-9 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No tasks here yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Assign a task or choose another status filter.
              </p>
            </div>
          ) : (
            visible.map((task) => (
              <article
                key={task.id}
                className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-semibold">{task.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.first_name} {task.last_name} · {task.staff_number}
                      {task.role_title ? ` · ${task.role_title}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[task.priority] ?? priorityStyles.normal}`}
                    >
                      {label(task.priority)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.display_status] ?? statusStyles.pending}`}
                    >
                      {label(task.display_status)}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {task.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
                  <span>
                    Deadline:{" "}
                    <strong className="font-medium text-foreground">
                      {dateLabel(task.due_date)}
                    </strong>
                  </span>
                  {task.completed_at && (
                    <span>
                      Completed:{" "}
                      {new Date(task.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {task.completion_note && (
                  <div className="mt-3 rounded-xl bg-muted/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Teacher&apos;s completion note
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                      {task.completion_note}
                    </p>
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
