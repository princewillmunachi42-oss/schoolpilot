"use client";

import { FormEvent, useEffect, useState } from "react";

type Session = {
  id: string;
  name: string;
};

export default function EditTermPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [termId, setTermId] = useState("");
  const [academicSessionId, setAcademicSessionId] = useState("");
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      setMessage("Term ID is missing.");
      setLoading(false);
      return;
    }

    setTermId(id);

    async function loadData() {
      try {
        const [termResponse, sessionsResponse] = await Promise.all([
          fetch(`/api/school/terms/${encodeURIComponent(id!)}`),
          fetch("/api/school/sessions"),
        ]);

        const termData = await termResponse.json();
        const sessionsData = await sessionsResponse.json();

        if (!termResponse.ok) {
          throw new Error(
            termData.message || "Unable to load term."
          );
        }

        if (!sessionsResponse.ok) {
          throw new Error(
            sessionsData.message || "Unable to load sessions."
          );
        }

        const term = termData.term;

        setAcademicSessionId(term.academic_session_id);
        setName(term.name);
        setStartDate(
          new Date(term.start_date).toISOString().split("T")[0]
        );
        setEndDate(
          new Date(term.end_date).toISOString().split("T")[0]
        );
        setIsCurrent(Boolean(term.is_current));
        setSessions(sessionsData.sessions || []);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load term."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/school/terms", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: termId,
          academicSessionId,
          name,
          startDate,
          endDate,
          isCurrent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update term."
        );
      }

      window.location.href = "/dashboard/terms";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update term."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p className="text-sm text-muted-foreground">
          Loading term...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <a
            href="/dashboard/terms"
            className="text-sm font-semibold underline"
          >
            ← Back to Terms
          </a>

          <h1 className="mt-4 text-2xl font-bold">
            Edit Term
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update the academic term information.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border p-5"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Academic Session
            </label>

            <select
              value={academicSessionId}
              onChange={(event) =>
                setAcademicSessionId(event.target.value)
              }
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
            >
              <option value="">Select session</option>

              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Term Name
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-lg border bg-background px-3 py-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                required
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                required
                className="w-full rounded-lg border bg-background px-3 py-2"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(event) =>
                setIsCurrent(event.target.checked)
              }
              className="h-4 w-4"
            />

            Set as current term
          </label>

          <button
            type="submit"
            disabled={saving}
            className="min-h-10 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </main>
  );
}
