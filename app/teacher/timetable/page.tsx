"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
} from "lucide-react";

type TimetableEntry = {
  id: string;
  day_of_week: number;
  room: string | null;
  is_active: boolean;
  period_name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  class_name: string;
  subject_name: string;
  subject_code: string | null;
};

const days: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

function formatTime(value: string) {
  return value.slice(0, 5);
}

export default function TeacherTimetablePage() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTimetable() {
      try {
        setError("");

        const response = await fetch("/api/teacher/timetable", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load your timetable."
          );
        }

        setEntries(data.timetable || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load your timetable."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTimetable();
  }, []);

  const grouped = entries.reduce<Record<number, TimetableEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.day_of_week]) {
        acc[entry.day_of_week] = [];
      }

      acc[entry.day_of_week].push(entry);
      return acc;
    },
    {}
  );

  const orderedDays = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  const totalPeriods = entries.length;
  const totalDays = orderedDays.length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <Link
            href="/teacher"
            className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teacher Dashboard
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CalendarDays className="h-4 w-4" />
                Teacher Portal
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                My Timetable
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                View your assigned teaching periods and weekly schedule.
              </p>
            </div>

            {!loading && !error && entries.length > 0 && (
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm">
                <Clock3 className="h-4 w-4 text-primary" />
                {totalPeriods}{" "}
                {totalPeriods === 1 ? "period" : "periods"} across{" "}
                {totalDays} {totalDays === 1 ? "day" : "days"}
              </div>
            )}
          </div>
        </div>

        {!loading && !error && entries.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Teaching Days
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {totalDays}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Teaching Periods
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    {totalPeriods}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Assigned Schedule
                  </p>

                  <p className="mt-1 text-2xl font-bold">
                    Active
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <span className="font-bold">!</span>
              </div>

              <div>
                <h2 className="font-semibold text-destructive">
                  Unable to load timetable
                </h2>

                <p className="mt-1 text-sm leading-6 text-destructive/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div>
            <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-muted" />

            <div className="space-y-5">
              {[1, 2, 3].map((item) => (
                <section
                  key={item}
                  className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-5 space-y-2">
                    <div className="h-6 w-28 animate-pulse rounded-lg bg-muted" />
                    <div className="h-4 w-36 animate-pulse rounded-lg bg-muted" />
                  </div>

                  <div className="space-y-3">
                    {[1, 2].map((period) => (
                      <div
                        key={period}
                        className="rounded-xl border bg-background p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="space-y-2">
                            <div className="h-5 w-32 animate-pulse rounded-lg bg-muted" />
                            <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
                          </div>

                          <div className="space-y-2 sm:text-right">
                            <div className="ml-auto h-5 w-28 animate-pulse rounded-lg bg-muted" />
                            <div className="ml-auto h-4 w-20 animate-pulse rounded-lg bg-muted" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : !error && entries.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No timetable entries yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              You do not currently have any timetable periods assigned to
              you. Your school administrator can add them from the timetable
              management page.
            </p>

            <Link
              href="/teacher"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Weekly Teaching Schedule
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your assigned periods are grouped by teaching day.
              </p>
            </div>

            {orderedDays.map((day) => (
              <section
                key={day}
                className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
              >
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <h2 className="text-xl font-semibold">
                        {days[day] || `Day ${day}`}
                      </h2>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {grouped[day].length} teaching period
                      {grouped[day].length === 1 ? "" : "s"} scheduled
                    </p>
                  </div>

                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                    <Clock3 className="h-3.5 w-3.5" />
                    {grouped[day].length}{" "}
                    {grouped[day].length === 1 ? "period" : "periods"}
                  </span>
                </div>

                <div className="space-y-3">
                  {grouped[day].map((entry) => (
                    <article
                      key={entry.id}
                      className="group rounded-xl border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <GraduationCap className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">
                                {entry.subject_name}
                              </h3>

                              {entry.subject_code && (
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                  {entry.subject_code}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {entry.class_name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 lg:min-w-56">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Clock3 className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold">
                              {formatTime(entry.start_time)} –{" "}
                              {formatTime(entry.end_time)}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {entry.period_name}
                            </p>
                          </div>
                        </div>
                      </div>

                      {entry.room && (
                        <div className="mt-4 flex items-center gap-2 border-t pt-4 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Room
                          </span>
                          <span className="font-medium">
                            {entry.room}
                          </span>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
