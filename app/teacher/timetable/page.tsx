"use client";

import { useEffect, useState } from "react";

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

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <a
            href="/teacher"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to Teacher Dashboard
          </a>

          <p className="text-sm font-medium text-primary">
            Teacher Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Timetable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
         View your assigned teaching periods.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Loading your timetable...
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl">
              🗓️
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No timetable entries yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              You do not currently have any timetable periods assigned to you.
              Your school administrator can add them from the timetable management page.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(grouped)
              .map(Number)
              .sort((a, b) => a - b)
              .map((day) => (
                <section
                  key={day}
                  className="rounded-2xl border bg-card p-5 sm:p-6"
                >
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold">
                      {days[day] || `Day ${day}`}
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {grouped[day].length} teaching period
                      {grouped[day].length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {grouped[day].map((entry) => (
                      <article
                        key={entry.id}
                        className="rounded-xl border bg-background p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold">
                                {entry.subject_name}
                              </h3>

                              {entry.subject_code && (
                                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                  {entry.subject_code}
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {entry.class_name}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="font-medium">
                              {formatTime(entry.start_time)} –{" "}
                              {formatTime(entry.end_time)}
                            </p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {entry.period_name}
                            </p>
                          </div>
                        </div>

                        {entry.room && (
                          <div className="mt-4 border-t pt-3">
                            <p className="text-xs text-muted-foreground">
                              Room
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {entry.room}
                            </p>
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
