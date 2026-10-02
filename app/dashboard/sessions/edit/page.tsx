"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Session = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
};

export default function EditSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");

  const [session, setSession] = useState<Session | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Invalid academic session.");
      setLoading(false);
      return;
    }

    async function loadSession() {
  try {
    if (!id) {
      throw new Error("Invalid academic session.");
    }

    const response = await fetch(
      `/api/school/sessions/${encodeURIComponent(id)}`
    );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load academic session."
          );
        }

        const loadedSession = data.session;

        setSession(loadedSession);
        setName(loadedSession.name);
        setStartDate(
          String(loadedSession.start_date).slice(0, 10)
        );
        setEndDate(
          String(loadedSession.end_date).slice(0, 10)
        );
        setIsCurrent(Boolean(loadedSession.is_current));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load academic session."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [id]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!id) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/school/sessions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          name,
          startDate,
          endDate,
          isCurrent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update academic session."
        );
      }

      router.push("/dashboard/sessions");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update academic session."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="p-6">
        <p>Loading academic session...</p>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-xl rounded-xl border p-6">
          <h1 className="text-xl font-semibold">
            Unable to edit session
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/sessions")}
            className="mt-6 rounded-lg border px-4 py-2 font-medium"
          >
            Back to Sessions
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard/sessions")}
          className="mb-6 rounded-lg border px-4 py-2 text-sm font-medium"
        >
          ← Back to Sessions
        </button>

        <div className="rounded-2xl border bg-card p-6">
          <h1 className="text-2xl font-bold">
            Edit Academic Session
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update the academic session details.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold"
              >
                Session name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-semibold"
              >
                Start date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                required
                className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-semibold"
              >
                End date
              </label>

              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(event.target.value)
                }
                required
                className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                checked={isCurrent}
                onChange={(event) =>
                  setIsCurrent(event.target.checked)
                }
                className="h-4 w-4"
              />

              <span>
                <span className="block text-sm font-semibold">
                  Set as current session
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  This will make this the active academic session.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard/sessions")}
                className="rounded-xl border px-5 py-3 text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
