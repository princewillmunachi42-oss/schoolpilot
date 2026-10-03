"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  other_name?: string | null;
  admission_number: string;
  class_id?: string | null;
  class_name?: string | null;
};

type Session = {
  id: string;
  name: string;
};

type Term = {
  id: string;
  name: string;
  academic_session_id: string;
};

type TimetableEntry = {
  id: string;
  day_of_week: number;
  room?: string | null;
  is_active: boolean;
  academic_session_id: string;
  term_id: string;
  period_id: string;
  class_id: string;
  subject_id: string;
  session_name: string;
  term_name: string;
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
  sessions: Session[];
  terms: Term[];
  timetable: TimetableEntry[];
  error?: string;
};

const days = [
  { value: 1, name: "Monday" },
  { value: 2, name: "Tuesday" },
  { value: 3, name: "Wednesday" },
  { value: 4, name: "Thursday" },
  { value: 5, name: "Friday" },
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

export default function ParentTimetablePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  async function loadTimetable(
    selectedStudent = studentId,
    selectedSession = sessionId,
    selectedTerm = termId
  ) {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (selectedStudent) {
        params.set("student", selectedStudent);
      }

      if (selectedSession) {
        params.set("session", selectedSession);
      }

      if (selectedTerm) {
        params.set("term", selectedTerm);
      }

      const response = await fetch(
        `/api/parent/timetable?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load timetable."
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
          : "Failed to load timetable."
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
        (child) => child.id === studentId
      ),
    [data?.children, studentId]
  );

  const filteredTerms = useMemo(() => {
    if (!data) return [];

    if (!sessionId) return data.terms;

    return data.terms.filter(
      (term) => term.academic_session_id === sessionId
    );
  }, [data, sessionId]);

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

  function handleStudentChange(value: string) {
    setStudentId(value);
    loadTimetable(value, sessionId, termId);
  }

  function handleSessionChange(value: string) {
    setSessionId(value);

    const validTerm = data?.terms.find(
      (term) =>
        term.id === termId &&
        (!value ||
          term.academic_session_id === value)
    );

    const nextTerm = validTerm ? termId : "";

    setTermId(nextTerm);
    loadTimetable(studentId, value, nextTerm);
  }

  function handleTermChange(value: string) {
    setTermId(value);
    loadTimetable(studentId, sessionId, value);
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        <header className="rounded-2xl border bg-white p-5 shadow-sm">
          <Link
            href="/parent"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Parent Dashboard
          </Link>

          <p className="mt-4 text-sm text-gray-500">
            Parent Portal
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Timetable
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            View your child&apos;s weekly class timetable.
          </p>
        </header>

        {loading && !data ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading timetable...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : !data || data.children.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              No linked children were found.
            </p>
          </div>
        ) : (
          /*
           * ONE MAIN PARENT PORTAL CARD
           */
          <section className="rounded-2xl border bg-white p-5 shadow-sm">

            {/* Filters */}
            <div className="border-b pb-5">
              <h2 className="font-semibold text-gray-900">
                Timetable
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select the child, academic session and term.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-3">

                <div>
                  <label
                    htmlFor="student"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Child
                  </label>

                  <select
                    id="student"
                    value={studentId}
                    onChange={(event) =>
                      handleStudentChange(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500"
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
                </div>

                <div>
                  <label
                    htmlFor="session"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Academic Session
                  </label>

                  <select
                    id="session"
                    value={sessionId}
                    onChange={(event) =>
                      handleSessionChange(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500"
                  >
                    <option value="">
                      All Sessions
                    </option>

                    {data.sessions.map((session) => (
                      <option
                        key={session.id}
                        value={session.id}
                      >
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="term"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Term
                  </label>

                  <select
                    id="term"
                    value={termId}
                    onChange={(event) =>
                      handleTermChange(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-500"
                  >
                    <option value="">
                      All Terms
                    </option>

                    {filteredTerms.map((term) => (
                      <option
                        key={term.id}
                        value={term.id}
                      >
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Selected Child */}
            {selectedChild && (
              <div className="border-b py-5">
                <p className="text-sm text-gray-500">
                  Selected Child
                </p>

                <h3 className="mt-1 font-semibold text-gray-900">
                  {selectedChild.first_name}{" "}
                  {selectedChild.last_name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedChild.class_name ||
                    "Class not assigned"}{" "}
                  • Admission No:{" "}
                  {selectedChild.admission_number}
                </p>
              </div>
            )}

            {/* Timetable Content */}
            <div className="pt-5">

              {data.timetable.length === 0 ? (
                <div className="rounded-xl border bg-gray-50 p-8 text-center">
                  <h2 className="font-semibold text-gray-900">
                    No timetable records found
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    There are no timetable entries for the
                    selected child and filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {days.map((day) => {
                    const entries =
                      timetableByDay[day.value] || [];

                    return (
                      <div
                        key={day.value}
                        className="overflow-hidden rounded-2xl border"
                      >
                        <div className="flex items-center justify-between bg-gray-50 px-5 py-4">
                          <h2 className="font-semibold text-gray-900">
                            {day.name}
                          </h2>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                            {entries.length}{" "}
                            {entries.length === 1
                              ? "class"
                              : "classes"}
                          </span>
                        </div>

                        {entries.length === 0 ? (
                          <div className="p-5 text-sm text-gray-500">
                            No classes scheduled.
                          </div>
                        ) : (
                          <div className="divide-y">
                            {entries.map((entry) => (
                              <div
                                key={entry.id}
                                className="p-5"
                              >
                                <div className="grid gap-4 md:grid-cols-[170px_1fr_160px] md:items-center">

                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {formatTime(
                                        entry.start_time
                                      )}{" "}
                                      –{" "}
                                      {formatTime(
                                        entry.end_time
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                      Period{" "}
                                      {entry.period_number}
                                    </p>
                                  </div>

                                  <div>
                                    {entry.is_break ? (
                                      <>
                                        <p className="font-semibold text-gray-900">
                                          {entry.period_name}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                          Break
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="font-semibold text-gray-900">
                                          {entry.subject_name}

                                          {entry.subject_code
                                            ? ` (${entry.subject_code})`
                                            : ""}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                          {entry.class_name}
                                        </p>
                                      </>
                                    )}

                                    <p className="mt-2 text-xs text-gray-500">
                                      {entry.session_name}{" "}
                                      •{" "}
                                      {entry.term_name}
                                    </p>
                                  </div>

                                  <div className="md:text-right">
                                    <p className="text-xs text-gray-500">
                                      Room
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-gray-900">
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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
