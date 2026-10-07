"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Coffee,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Timer,
  Trash2,
  X,
} from "lucide-react";

type Period = {
  id: string;
  name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  is_active: boolean;
};

function formatTime(value: string) {
  const [hours, minutes] = String(value).slice(0, 5).split(":");
  const hour = Number(hours);

  if (Number.isNaN(hour)) {
    return String(value).slice(0, 5);
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minutes} ${suffix}`;
}

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
        throw new Error(data.message || "Failed to save period");
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
        err instanceof Error ? err.message : "Failed to save timetable period"
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

  function handleCancelEdit() {
    setEditingPeriodId("");
    setName("");
    setPeriodNumber("");
    setStartTime("");
    setEndTime("");
    setIsBreak(false);
    setMessage("");
    setError("");
  }

  async function handleDelete(id: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this timetable period?"
      )
    ) {
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
        handleCancelEdit();
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

  const sortedPeriods = useMemo(
    () =>
      [...periods].sort(
        (a, b) => a.period_number - b.period_number
      ),
    [periods]
  );

  const breakCount = periods.filter((period) => period.is_break).length;
  const teachingCount = periods.filter((period) => !period.is_break).length;
  const activeCount = periods.filter((period) => period.is_active).length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <CalendarClock className="h-4 w-4" />
                Academic Management
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Timetable Periods
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Define the school day structure, lesson times, breaks, and
                other timetable periods.
              </p>
            </div>

            <div className="hidden shrink-0 rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:block">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Timetable structure
              </p>
              <p className="mt-1 text-lg font-bold">
                {periods.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  periods
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock3 className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Total
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">{periods.length}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Configured periods
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Active
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">{activeCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Available timetable periods
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                <Timer className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Lessons
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">{teachingCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Teaching periods
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Coffee className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Breaks
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold">{breakCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Non-teaching periods
            </p>
          </div>
        </div>

        {(message || error) && (
          <div className="mb-6 space-y-3">
            {message && (
              <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <section className="h-fit overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {editingPeriodId ? (
                    <Pencil className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <h2 className="font-semibold">
                    {editingPeriodId ? "Edit Period" : "Add Period"}
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {editingPeriodId
                      ? "Update this timetable period."
                      : "Create a lesson or non-teaching period."}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
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
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="periodNumber"
                  className="mb-2 block text-sm font-medium"
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
                  className="min-h-11 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <p className="mt-1.5 text-xs text-muted-foreground">
                  Used to determine the order of the school day.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="startTime"
                    className="mb-2 block text-sm font-medium"
                  >
                    Start time
                  </label>

                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="mb-2 block text-sm font-medium"
                  >
                    End time
                  </label>

                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40">
                <input
                  type="checkbox"
                  checked={isBreak}
                  onChange={(e) => setIsBreak(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border accent-primary"
                />

                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Coffee className="h-4 w-4 text-warning" />
                    Break period
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    Use this for break, lunch, assembly, or another
                    non-teaching period.
                  </span>
                </span>
              </label>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {editingPeriodId ? "Updating..." : "Adding..."}
                    </>
                  ) : editingPeriodId ? (
                    <>
                      <Save className="h-4 w-4" />
                      Update Period
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Period
                    </>
                  )}
                </button>

                {editingPeriodId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <CalendarClock className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">School Periods</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {periods.length} configured{" "}
                      {periods.length === 1 ? "period" : "periods"}
                    </p>
                  </div>
                </div>

                {periods.length > 0 && (
                  <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {teachingCount} teaching · {breakCount} breaks
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 p-5 sm:p-6">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="flex animate-pulse items-center gap-4 rounded-xl border border-border p-4"
                  >
                    <div className="h-11 w-11 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-48 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedPeriods.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Clock3 className="h-8 w-8" />
                </div>

                <h3 className="mt-5 font-semibold">
                  No periods configured
                </h3>

                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Start by adding the first lesson period or break using the
                  form.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="group p-5 transition-colors hover:bg-muted/20 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="hidden text-muted-foreground sm:block">
                          <GripVertical className="h-4 w-4" />
                        </div>

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            period.is_break
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {period.period_number}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold">
                              {period.name}
                            </h3>

                            {period.is_break ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                                <Coffee className="h-3 w-3" />
                                Break
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                                <CheckCircle2 className="h-3 w-3" />
                                Lesson
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 className="h-3.5 w-3.5" />
                              {formatTime(period.start_time)} –{" "}
                              {formatTime(period.end_time)}
                            </span>

                            <span>
                              Period {period.period_number}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:pl-4">
                        <button
                          type="button"
                          onClick={() => handleEdit(period)}
                          disabled={saving}
                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(period.id)}
                          disabled={saving}
                          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-background px-3.5 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold">Timetable structure</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                These periods are used when creating lessons on the school
                timetable. Keep the period numbers and times consistent with
                your actual school schedule.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
