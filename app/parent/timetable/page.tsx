"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  DoorOpen,
  GraduationCap,
  RefreshCw,
  Sparkles,
  Coffee,
} from "lucide-react";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  other_name?: string | null;
  admission_number: string;
  class_id?: string | null;
  class_name?: string | null;
};

type TimetableEntry = {
  id: string;
  day_of_week: number;
  room?: string | null;
  is_active: boolean;
  period_id: string;
  class_id: string;
  subject_id: string;
  period_name: string;
  period_number: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  class_name: string;
  subject_name: string;
  subject_code?: string | null;
};

type ApiResponse = {
  children: Child[];
  selectedStudentId: string;
  timetable: TimetableEntry[];
  error?: string;
};

const days = [
  { value: 1, name: "Monday", short: "MON" },
  { value: 2, name: "Tuesday", short: "TUE" },
  { value: 3, name: "Wednesday", short: "WED" },
  { value: 4, name: "Thursday", short: "THU" },
  { value: 5, name: "Friday", short: "FRI" },
];

function formatTime(time: string) {
  if (!time) return "";

  const [hourString, minuteString] = time.split(":");
  const hour = Number(hourString);
  const minute = minuteString ?? "00";

  if (Number.isNaN(hour)) return time;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function ParentTimetablePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [studentId, setStudentId] = useState("");

  async function loadTimetable(selectedStudent = studentId) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (selectedStudent) {
        params.set("student", selectedStudent);
      }

      const response = await fetch(
        `/api/parent/timetable?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load timetable.",
        );
      }

      setData(result);

      if (!selectedStudent && result.selectedStudentId) {
        setStudentId(result.selectedStudentId);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load timetable.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedChild = useMemo(
    () =>
      data?.children.find(
        (child) => child.id === studentId,
      ),
    [data?.children, studentId],
  );

  const timetableByDay = useMemo(() => {
    const grouped: Record<number, TimetableEntry[]> = {};

    for (const day of days) {
      grouped[day.value] = [];
    }

    for (const entry of data?.timetable || []) {
      if (!grouped[entry.day_of_week]) {
        grouped[entry.day_of_week] = [];
      }

      grouped[entry.day_of_week].push(entry);
    }

    return grouped;
  }, [data?.timetable]);

  const totalClasses = useMemo(
    () =>
      (data?.timetable || []).filter(
        (entry) => !entry.is_break,
      ).length,
    [data?.timetable],
  );

  const totalBreaks = useMemo(
    () =>
      (data?.timetable || []).filter(
        (entry) => entry.is_break,
      ).length,
    [data?.timetable],
  );

  const activeDays = useMemo(
    () =>
      days.filter(
        (day) =>
          (timetableByDay[day.value] || []).length > 0,
      ).length,
    [timetableByDay],
  );

  function handleStudentChange(value: string) {
    setStudentId(value);
    loadTimetable(value);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <header className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="relative overflow-hidden p-5 sm:p-7">
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[var(--accent)] opacity-10 blur-3xl" />

            <div className="relative">
              <Link
                href="/parent"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition hover:opacity-80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Parent Dashboard
              </Link>

              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Parent Portal
                  </div>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Weekly Timetable
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                    View your child&apos;s weekly class schedule,
                    periods, rooms, and breaks in one place.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadTimetable(studentId)}
                  disabled={loading}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Loading */}
        {loading && !data ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <RefreshCw className="h-5 w-5 animate-spin text-[var(--primary)]" />
              </div>

              <div>
                <p className="font-semibold">
                  Loading timetable
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Fetching the latest schedule...
                </p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="rounded-2xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 p-5">
              <p className="font-semibold text-[var(--destructive)]">
                Unable to load timetable
              </p>

              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                {error}
              </p>

              <button
                type="button"
                onClick={() => loadTimetable(studentId)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        ) : !data || data.children.length === 0 ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)]">
              <GraduationCap className="h-7 w-7 text-[var(--muted-foreground)]" />
            </div>

            <h2 className="mt-4 text-lg font-bold">
              No linked children found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
              There are currently no students linked to this
              parent account.
            </p>
          </div>
        ) : (
          <>
            {/* Child + Summary */}
            <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">

              {/* Child Selector */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                    <GraduationCap className="h-5 w-5 text-[var(--primary)]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Child Timetable
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Choose a linked student
                    </p>
                  </div>
                </div>

                <label
                  htmlFor="student"
                  className="mt-6 block text-sm font-semibold"
                >
                  Select child
                </label>

                <select
                  id="student"
                  value={studentId}
                  onChange={(event) =>
                    handleStudentChange(event.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                  {data.children.map((child) => (
                    <option
                      key={child.id}
                      value={child.id}
                    >
                      {child.first_name}{" "}
                      {child.last_name}
                    </option>
                  ))}
                </select>

                {selectedChild && (
                  <div className="mt-5 rounded-2xl bg-[var(--muted)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-bold text-white">
                        {getInitials(
                          selectedChild.first_name,
                          selectedChild.last_name,
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {selectedChild.first_name}{" "}
                          {selectedChild.last_name}
                        </p>

                        <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                          {selectedChild.class_name ||
                            "Class not assigned"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-[var(--border)] pt-3">
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Admission Number
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {selectedChild.admission_number}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                      <BookOpenIcon />
                    </div>

                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                      Weekly
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-bold">
                    {totalClasses}
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Class periods
                  </p>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                      <CalendarDays className="h-5 w-5 text-[var(--accent)]" />
                    </div>

                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                      Monday–Friday
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-bold">
                    {activeDays}
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Active school days
                  </p>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--warning)]/10">
                      <Coffee className="h-5 w-5 text-[var(--warning)]" />
                    </div>

                    <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                      Schedule
                    </span>
                  </div>

                  <p className="mt-5 text-3xl font-bold">
                    {totalBreaks}
                  </p>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Break periods
                  </p>
                </div>
              </div>
            </section>

            {/* Timetable */}
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-[var(--primary)]" />

                    <h2 className="text-lg font-bold">
                      Weekly Schedule
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Daily periods, subjects, rooms, and break times.
                  </p>
                </div>

                {selectedChild && (
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
                    {selectedChild.class_name ||
                      "Class not assigned"}
                  </div>
                )}
              </div>

              {data.timetable.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/50 p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--card)]">
                    <CalendarDays className="h-7 w-7 text-[var(--muted-foreground)]" />
                  </div>

                  <h2 className="mt-4 font-bold">
                    No timetable records found
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
                    There are no timetable entries for this
                    child&apos;s current class.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {days.map((day) => {
                    const entries =
                      timetableByDay[day.value] || [];

                    return (
                      <div
                        key={day.value}
                        className="overflow-hidden rounded-2xl border border-[var(--border)]"
                      >
                        {/* Day Header */}
                        <div className="flex items-center justify-between gap-3 bg-[var(--muted)] px-4 py-4 sm:px-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-xs font-bold text-white">
                              {day.short}
                            </div>

                            <div>
                              <h3 className="font-bold">
                                {day.name}
                              </h3>

                              <p className="text-xs text-[var(--muted-foreground)]">
                                {entries.length === 0
                                  ? "No scheduled periods"
                                  : `${entries.length} ${
                                      entries.length === 1
                                        ? "scheduled period"
                                        : "scheduled periods"
                                    }`}
                              </p>
                            </div>
                          </div>

                          <span className="hidden rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-semibold sm:inline-flex">
                            {entries.length}{" "}
                            {entries.length === 1
                              ? "period"
                              : "periods"}
                          </span>
                        </div>

                        {entries.length === 0 ? (
                          <div className="px-5 py-5 text-sm text-[var(--muted-foreground)]">
                            No classes scheduled for this day.
                          </div>
                        ) : (
                          <div className="divide-y divide-[var(--border)]">
                            {entries.map((entry) => (
                              <div
                                key={entry.id}
                                className="p-4 transition hover:bg-[var(--muted)]/50 sm:p-5"
                              >
                                <div className="grid gap-4 lg:grid-cols-[190px_1fr_150px] lg:items-center">

                                  {/* Time */}
                                  <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                                      <Clock3 className="h-4.5 w-4.5 text-[var(--primary)]" />
                                    </div>

                                    <div>
                                      <p className="text-sm font-bold">
                                        {formatTime(
                                          entry.start_time,
                                        )}
                                      </p>

                                      <p className="text-xs text-[var(--muted-foreground)]">
                                        to{" "}
                                        {formatTime(
                                          entry.end_time,
                                        )}
                                      </p>

                                      <p className="mt-1 text-[11px] font-medium text-[var(--muted-foreground)]">
                                        Period{" "}
                                        {entry.period_number}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Subject */}
                                  <div className="min-w-0">
                                    {entry.is_break ? (
                                      <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--warning)]/10">
                                          <Coffee className="h-5 w-5 text-[var(--warning)]" />
                                        </div>

                                        <div>
                                          <p className="font-bold">
                                            {entry.period_name}
                                          </p>

                                          <span className="mt-1 inline-flex rounded-full bg-[var(--warning)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--warning)]">
                                            Break
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <p className="font-bold">
                                            {entry.subject_name}
                                          </p>

                                          {entry.subject_code && (
                                            <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                                              {entry.subject_code}
                                            </span>
                                          )}
                                        </div>

                                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                                          {entry.class_name}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Room */}
                                  <div className="rounded-xl bg-[var(--muted)] p-3 lg:bg-transparent lg:p-0 lg:text-right">
                                    <div className="flex items-center gap-2 lg:justify-end">
                                      <DoorOpen className="h-4 w-4 text-[var(--muted-foreground)]" />

                                      <p className="text-xs font-medium text-[var(--muted-foreground)]">
                                        Room
                                      </p>
                                    </div>

                                    <p className="mt-1 text-sm font-semibold lg:text-right">
                                      {entry.room ||
                                        "Not specified"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function BookOpenIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5 text-[var(--primary)]"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 0 17.5 16H6.5A2.5 2.5 0 0 0 4 18.5V5.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"
      />
    </svg>
  );
}
