"use client";

import { FormEvent, useEffect, useState } from "react";

type AcademicSession = {
  id: string;
  name: string;
};

type ClassData = {
  id: string;
  academic_session_id: string;
  name: string;
  capacity: number | null;
  status: "active" | "inactive";
};

export default function EditClassPage() {
  const [id, setId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [classData, setClassData] = useState<ClassData | null>(null);

  const [academicSessionId, setAcademicSessionId] = useState("");
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get("id");

    if (!classId) {
      setMessage("Class ID is missing.");
      setLoading(false);
      return;
    }

    setId(classId);

    async function loadData() {
      try {
        const [classResponse, sessionsResponse] = await Promise.all([
          fetch(`/api/school/classes/${encodeURIComponent(classId!)}`),
          fetch("/api/school/sessions"),
        ]);

        const classResult = await classResponse.json();
        const sessionsResult = await sessionsResponse.json();

        if (!classResponse.ok) {
          throw new Error(
            classResult.message || "Unable to load class."
          );
        }

        if (!sessionsResponse.ok) {
          throw new Error(
            sessionsResult.message || "Unable to load academic sessions."
          );
        }

        const loadedClass = classResult.class as ClassData;

        setClassData(loadedClass);
        setSessions(sessionsResult.sessions || []);

        setAcademicSessionId(loadedClass.academic_session_id);
        setName(loadedClass.name);
        setCapacity(
          loadedClass.capacity === null
            ? ""
            : String(loadedClass.capacity)
        );
        setStatus(loadedClass.status);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load class."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/school/classes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          academicSessionId,
          name,
          capacity,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to update class."
        );
      }

      window.location.href = "/dashboard/classes";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update class."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted-foreground">
          Loading class...
        </p>
      </main>
    );
  }

  if (!classData) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <a
          href="/dashboard/classes"
          className="text-sm font-semibold underline"
        >
          ← Back to Classes
        </a>

        <div className="mt-6 rounded-2xl border p-6">
          <p className="text-sm text-destructive">
            {message || "Class not found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <a
          href="/dashboard/classes"
          className="text-sm font-semibold underline"
        >
          ← Back to Classes
        </a>

        <h1 className="mt-4 text-2xl font-bold">
          Edit Class
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update this class information.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="academicSessionId"
              className="mb-2 block text-sm font-semibold"
            >
              Academic Session
            </label>

            <select
              id="academicSessionId"
              value={academicSessionId}
              onChange={(event) =>
                setAcademicSessionId(event.target.value)
              }
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="">Select academic session</option>

              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-semibold"
            >
              Class Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="capacity"
              className="mb-2 block text-sm font-semibold"
            >
              Capacity
            </label>

            <input
              id="capacity"
              type="number"
              min="1"
              value={capacity}
              onChange={(event) =>
                setCapacity(event.target.value)
              }
              placeholder="Optional"
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold"
            >
              Status
            </label>

            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as "active" | "inactive"
                )
              }
              className="w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {message && (
            <p className="text-sm text-destructive">
              {message}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <a
              href="/dashboard/classes"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Cancel
            </a>
          </div>
        </div>
      </form>
    </main>
  );
}
