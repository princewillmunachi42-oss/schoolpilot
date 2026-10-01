"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Period = {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  is_active: boolean;
};

export default function TimetablePeriodsPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [periodNumber, setPeriodNumber] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isBreak, setIsBreak] = useState(false);

  async function loadPeriods() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/school/timetable-periods", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load periods");
      }

      setPeriods(data.periods || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load timetable periods"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPeriods();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/school/timetable-periods", {
        method: editingPeriodId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  id: editingPeriodId || undefined,
  name,
  periodNumber: Number(periodNumber),
  startTime,
  endTime,
  isBreak,
  isActive: true,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create period");
      }

      setMessage(
  editingPeriodId
    ? "Period updated successfully."
    : "Period created successfully."
);

      setName("");
      setPeriodNumber("");
      setStartTime("");
      setEndTime("");
      setIsBreak(false);
      setEditingPeriodId("");
      await loadPeriods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create period"
      );
    } finally {
      setSaving(false);
    }
  }
         function handleEdit(period: Period) {
    setEditingPeriodId(period.id);
    setName(period.name);
    setPeriodNumber(String(period.period_number));
    setStartTime(String(period.start_time).slice(0, 5));
    setEndTime(String(period.end_time).slice(0, 5));
    setIsBreak(period.is_break);
    setMessage("Editing timetable period...");
    setError("");
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this timetable period?")) {
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await fetch("/api/school/timetable-periods", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete timetable period"
        );
      }

      if (editingPeriodId === id) {
        setEditingPeriodId("");
      }

      setMessage("Period deleted successfully.");
      await loadPeriods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete timetable period"
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-4">
            <h1 className="text-2xl font-bold tracking-tight">
              Timetable Periods
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Configure the school&apos;s lesson periods, times, and breaks.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Add Period</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Set the exact time structure your school uses.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Period name
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Period 1"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="periodNumber"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Period number
                </label>

                <input
                  id="periodNumber"
                  type="number"
                  min="1"
                  value={periodNumber}
                  onChange={(e) => setPeriodNumber(e.target.value)}
                  placeholder="1"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Start time
                  </label>

                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    End time
                  </label>

                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-border p-3">
                <input
                  type="checkbox"
                  checked={isBreak}
                  onChange={(e) => setIsBreak(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-medium">
                    Break period
                  </span>

                  <span className="block text-xs text-muted-foreground">
                    Use this for break, lunch, assembly, or another
                    non-teaching period.
                  </span>
                </span>
              </label>

              {message && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
  ? editingPeriodId
    ? "Updating..."
    : "Adding..."
  : editingPeriodId
    ? "Update Period"
    : "Add Period"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold">School Periods</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {periods.length} configured period
                {periods.length === 1 ? "" : "s"}
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading periods...
              </div>
            ) : periods.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-3xl">🕐</div>

                <h3 className="mt-3 font-semibold">
                  No periods configured
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Add the school&apos;s first period using the form.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {periods.map((period) => (
                  <div
                    key={period.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                        {period.period_number}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium">{period.name}</h3>

                          {period.is_break && (
                            <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                              Break
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {String(period.start_time).slice(0, 5)}
                          {" – "}
                          {String(period.end_time).slice(0, 5)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">
    Period {period.period_number}
  </span>

  <button
    type="button"
    onClick={() => handleEdit(period)}
    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
  >
    Edit
  </button>

  <button
    type="button"
    onClick={() => handleDelete(period.id)}
    className="rounded-md border border-destructive px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10"
  >
    Delete
  </button>
</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
