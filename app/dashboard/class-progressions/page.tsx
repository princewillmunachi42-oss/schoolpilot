"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  School,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type Session = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

type ClassItem = {
  id: string;
  name: string;
  academic_session_id: string;
  status: string;
};

type Progression = {
  id: string;
  from_class_id: string;
  to_class_id: string | null;
  repeat_class_id: string | null;
  to_academic_session_id: string;
  from_class_name: string;
  from_academic_session_id: string;
  to_class_name: string | null;
  repeat_class_name: string | null;
  to_session_name: string;
};

export default function ClassProgressionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [progressions, setProgressions] = useState<Progression[]>([]);

  const [fromClassId, setFromClassId] = useState("");
  const [targetSessionId, setTargetSessionId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [repeatClassId, setRepeatClassId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const sourceClasses = useMemo(
    () => classes.filter((item) => item.status === "active"),
    [classes]
  );

  const targetClasses = useMemo(
    () =>
      classes.filter(
        (item) =>
          item.status === "active" &&
          item.academic_session_id === targetSessionId
      ),
    [classes, targetSessionId]
  );

  const selectedFromClass = classes.find(
    (item) => item.id === fromClassId
  );

  const selectedTargetSession = sessions.find(
    (item) => item.id === targetSessionId
  );

  const currentSession = sessions.find((item) => item.is_current);

  const promotionCount = progressions.filter(
    (item) => item.to_class_id
  ).length;

  const repeatCount = progressions.filter(
    (item) => item.repeat_class_id
  ).length;

  const graduationCount = progressions.filter(
    (item) => !item.to_class_id
  ).length;

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        sessionsResponse,
        classesResponse,
        progressionsResponse,
      ] = await Promise.all([
        fetch("/api/school/sessions"),
        fetch("/api/school/classes"),
        fetch("/api/school/class-progressions"),
      ]);

      const sessionsData = await sessionsResponse.json();
      const classesData = await classesResponse.json();
      const progressionsData =
        await progressionsResponse.json();

      if (!sessionsResponse.ok || !sessionsData.success) {
        throw new Error(
          sessionsData.message ||
            "Failed to load academic sessions."
        );
      }

      if (!classesResponse.ok || !classesData.success) {
        throw new Error(
          classesData.message ||
            "Failed to load classes."
        );
      }

      if (
        !progressionsResponse.ok ||
        !progressionsData.success
      ) {
        throw new Error(
          progressionsData.message ||
            "Failed to load class progressions."
        );
      }

      const sessionList: Session[] =
        sessionsData.sessions ?? [];

      setSessions(sessionList);
      setClasses(classesData.classes ?? []);
      setProgressions(
        progressionsData.progressions ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load progression setup."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setFromClassId("");
    setTargetSessionId("");
    setToClassId("");
    setRepeatClassId("");
    setEditingId(null);
  }

  function editProgression(progression: Progression) {
    setEditingId(progression.id);
    setFromClassId(progression.from_class_id);
    setTargetSessionId(
      progression.to_academic_session_id
    );
    setToClassId(progression.to_class_id ?? "");
    setRepeatClassId(
      progression.repeat_class_id ?? ""
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveProgression(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!fromClassId || !targetSessionId) {
      setError(
        "Select the source class and target academic session."
      );
      return;
    }

    if (!toClassId && !repeatClassId) {
      setError(
        "Configure at least a promotion class or repeat class."
      );
      return;
    }

    if (
      selectedFromClass &&
      selectedTargetSession &&
      selectedFromClass.academic_session_id ===
        selectedTargetSession.id
    ) {
      setError(
        "The target academic session must be different from the source class session."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/school/class-progressions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromClassId,
            toClassId: toClassId || null,
            repeatClassId: repeatClassId || null,
            toAcademicSessionId: targetSessionId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to save class progression."
        );
      }

      setMessage(
        editingId
          ? "Class progression updated successfully."
          : "Class progression saved successfully."
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save class progression."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProgression(id: string) {
    if (
      !window.confirm(
        "Delete this class progression configuration?"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setMessage("");

      const response = await fetch(
        `/api/school/class-progressions?id=${encodeURIComponent(
          id
        )}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to delete progression."
        );
      }

      setMessage(
        "Class progression deleted successfully."
      );

      if (editingId === id) {
        resetForm();
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete progression."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-9 w-72 animate-pulse rounded-lg bg-muted" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl border bg-card"
              />
            ))}
          </div>
          <div className="h-80 animate-pulse rounded-2xl border bg-card" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="space-y-4">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </a>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <ArrowUpDown className="h-4 w-4" />
                People Management
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Class Progressions
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Define how students move from one class to another
                when transitioning into a new academic session.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
              <School className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                Current session:
              </span>
              <span className="font-semibold">
                {currentSession?.name ?? "Not set"}
              </span>
            </div>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="flex items-start gap-3 rounded-2xl border border-success/20 bg-success/5 p-4 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{message}</p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <ArrowUpDown className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Total
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold">
              {progressions.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Configured mappings
            </p>
          </div>

          <div className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-success/10 p-2.5 text-success">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Promotion
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold">
              {promotionCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Promotion pathways
            </p>
          </div>

          <div className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-warning/10 p-2.5 text-warning">
                <RefreshCw className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Repeat
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold">
              {repeatCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Repeat pathways
            </p>
          </div>

          <div className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                <School className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Graduation
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold">
              {graduationCount}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Graduation pathways
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    {editingId ? (
                      <Pencil className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </div>
                  <h2 className="text-lg font-semibold">
                    {editingId
                      ? "Edit progression"
                      : "Configure progression"}
                  </h2>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Map a source class to its next-session promotion
                  and repeat options.
                </p>
              </div>

              {editingId && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <Pencil className="h-3.5 w-3.5" />
                  Editing configuration
                </span>
              )}
            </div>
          </div>

          <form
            onSubmit={saveProgression}
            className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">
                From class
              </label>

              <select
                value={fromClassId}
                onChange={(event) => {
                  setFromClassId(event.target.value);
                  setToClassId("");
                  setRepeatClassId("");
                }}
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  Select source class
                </option>

                {sourceClasses.map((classItem) => {
                  const session = sessions.find(
                    (item) =>
                      item.id ===
                      classItem.academic_session_id
                  );

                  return (
                    <option
                      key={classItem.id}
                      value={classItem.id}
                    >
                      {classItem.name}
                      {session ? ` — ${session.name}` : ""}
                    </option>
                  );
                })}
              </select>

              <p className="mt-2 text-xs text-muted-foreground">
                Choose the active class students are progressing
                from.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                New academic session
              </label>

              <select
                value={targetSessionId}
                onChange={(event) => {
                  setTargetSessionId(event.target.value);
                  setToClassId("");
                  setRepeatClassId("");
                }}
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  Select target session
                </option>

                {sessions.map((session) => (
                  <option
                    key={session.id}
                    value={session.id}
                  >
                    {session.name}
                    {session.is_current
                      ? " (Current)"
                      : ""}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-muted-foreground">
                Target classes will be loaded from this session.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Promote to
              </label>

              <select
                value={toClassId}
                onChange={(event) =>
                  setToClassId(event.target.value)
                }
                disabled={!targetSessionId}
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  No promotion class
                </option>

                {targetClasses.map((classItem) => (
                  <option
                    key={classItem.id}
                    value={classItem.id}
                  >
                    {classItem.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-muted-foreground">
                Where successfully promoted students should move.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Repeat in
              </label>

              <select
                value={repeatClassId}
                onChange={(event) =>
                  setRepeatClassId(event.target.value)
                }
                disabled={!targetSessionId}
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  No repeat class
                </option>

                {targetClasses.map((classItem) => (
                  <option
                    key={classItem.id}
                    value={classItem.id}
                  >
                    {classItem.name}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-muted-foreground">
                Where students who repeat the class should remain.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4 lg:col-span-2">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Progression workflow
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    These mappings are used by the student promotion
                    process to determine the next class or repeat
                    destination.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingId ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update progression"
                    : "Save progression"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-semibold">
                    Configured progressions
                  </h2>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  Existing class mappings used by the student
                  promotion workflow.
                </p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {progressions.length} configured
              </span>
            </div>
          </div>

          {progressions.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                <ArrowUpDown className="h-8 w-8" />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No progressions configured
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create your first class progression above to define
                how students should move between academic sessions.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {progressions.map((progression) => (
                <article
                  key={progression.id}
                  className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-sm font-semibold">
                          {progression.from_class_name}
                        </span>

                        <ArrowRight className="h-4 w-4 text-muted-foreground" />

                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-sm font-semibold text-success">
                          {progression.to_class_name ??
                            "Graduate"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <School className="h-4 w-4 shrink-0" />
                          <span>
                            Target:{" "}
                            <span className="font-medium text-foreground">
                              {progression.to_session_name}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <RefreshCw className="h-4 w-4 shrink-0" />
                          <span>
                            Repeat:{" "}
                            <span className="font-medium text-foreground">
                              {progression.repeat_class_name ??
                                "Not configured"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          editProgression(progression)
                        }
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteProgression(progression.id)
                        }
                        disabled={
                          deletingId === progression.id
                        }
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === progression.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold">
                How class progression works
              </h3>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Configure each source class once for the target
                academic session. During student promotions, the
                configured destination determines where promoted or
                repeating students can be placed.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
