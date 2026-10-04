"use client";

import { useEffect, useMemo, useState } from "react";

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
    () =>
      classes.filter(
        (item) => item.status === "active"
      ),
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
    event: React.FormEvent<HTMLFormElement>
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
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-muted-foreground">
            Loading class progressions...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <a
            href="/dashboard"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-3 text-2xl font-bold">
            Class Progressions
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure how students move between classes when a
            new academic session becomes current.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            {message}
          </div>
        )}

        <section className="rounded-xl border p-4 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">
              {editingId
                ? "Edit progression"
                : "Configure progression"}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              The source class belongs to the completed session.
              Target classes must belong to the new session.
            </p>
          </div>

          <form
            onSubmit={saveProgression}
            className="grid gap-4 lg:grid-cols-2"
          >
            <div>
              <label className="mb-2 block text-sm font-medium">
                From class
              </label>

              <select
                value={fromClassId}
                onChange={(event) => {
                  setFromClassId(event.target.value);
                  setToClassId("");
                  setRepeatClassId("");
                }}
                className="w-full rounded-lg border bg-background px-3 py-2"
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
                      {session
                        ? ` — ${session.name}`
                        : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                New academic session
              </label>

              <select
                value={targetSessionId}
                onChange={(event) => {
                  setTargetSessionId(event.target.value);
                  setToClassId("");
                  setRepeatClassId("");
                }}
                className="w-full rounded-lg border bg-background px-3 py-2"
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Promote to
              </label>

              <select
                value={toClassId}
                onChange={(event) =>
                  setToClassId(event.target.value)
                }
                disabled={!targetSessionId}
                className="w-full rounded-lg border bg-background px-3 py-2 disabled:opacity-50"
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Repeat in
              </label>

              <select
                value={repeatClassId}
                onChange={(event) =>
                  setRepeatClassId(event.target.value)
                }
                disabled={!targetSessionId}
                className="w-full rounded-lg border bg-background px-3 py-2 disabled:opacity-50"
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
            </div>

            <div className="flex flex-wrap gap-2 lg:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
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
                  className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border">
          <div className="border-b p-4">
            <h2 className="font-semibold">
              Configured progressions
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              These mappings are used by the student promotion
              process.
            </p>
          </div>

          {progressions.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No class progressions have been configured yet.
            </div>
          ) : (
            <div className="divide-y">
              {progressions.map((progression) => (
                <div
                  key={progression.id}
                  className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {progression.from_class_name}
                      {" → "}
                      {progression.to_class_name ??
                        "Graduate"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Target session:{" "}
                      {progression.to_session_name}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Repeat:{" "}
                      {progression.repeat_class_name ??
                        "Not configured"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        editProgression(progression)
                      }
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
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
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {deletingId === progression.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
