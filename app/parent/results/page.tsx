"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  other_name?: string | null;
  admission_number: string;
  class_name?: string | null;
  relationship?: string | null;
};

type Session = {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status?: string;
};

type Term = {
  id: string;
  name: string;
  academic_session_id: string;
  start_date?: string;
  end_date?: string;
  status?: string;
};

type Result = {
  id: string;
  ca_score: number;
  exam_score: number;
  total_score: number;
  grade?: string | null;
  remarks?: string | null;
  academic_session_id: string;
  term_id: string;
  session_name: string;
  term_name: string;
  subject_name: string;
  subject_code?: string | null;
};

type ResultsResponse = {
  success: boolean;
  message?: string;
  children: Child[];
  selectedStudentId?: string;
  sessions: Session[];
  terms: Term[];
  results: Result[];
};

export default function ParentResultsPage() {
  const [data, setData] = useState<ResultsResponse | null>(null);
  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadResults(
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
        `/api/parent/results?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load results.");
      }

      setData(result);

      if (!selectedStudent && result.selectedStudentId) {
        setStudentId(result.selectedStudentId);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load results."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStudentChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;
    setStudentId(value);
    loadResults(value, sessionId, termId);
  }

  function handleSessionChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;
    setSessionId(value);
    setTermId("");
    loadResults(studentId, value, "");
  }

  function handleTermChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;
    setTermId(value);
    loadResults(studentId, sessionId, value);
  }

  const selectedChild = data?.children.find(
    (child) => child.id === studentId
  );

  const totalSubjects = data?.results.length || 0;

  const totalScore = (data?.results || []).reduce(
    (sum, result) => sum + Number(result.total_score || 0),
    0
  );

  const average = totalSubjects > 0 ? totalScore / totalSubjects : 0;

  const gradeCounts = (data?.results || []).reduce(
    (counts, result) => {
      const grade = (result.grade || "N/A").toUpperCase();

      if (grade === "A") counts.a += 1;
      else if (grade === "B") counts.b += 1;
      else if (grade === "C") counts.c += 1;
      else if (grade === "D") counts.d += 1;
      else if (grade === "E") counts.e += 1;
      else if (grade === "F") counts.f += 1;

      return counts;
    },
    { a: 0, b: 0, c: 0, d: 0, e: 0, f: 0 }
  );

  function getGradeClass(grade?: string | null) {
    const value = (grade || "").toUpperCase();

    if (value === "A") {
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300";
    }

    if (value === "B") {
      return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300";
    }

    if (value === "C") {
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300";
    }

    if (value === "D" || value === "E") {
      return "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300";
    }

    if (value === "F") {
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300";
    }

    return "bg-slate-100 text-slate-700 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300";
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--foreground)] sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/parent"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Parent Dashboard
          </Link>
        </div>

        <section className="mb-7 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="relative overflow-hidden p-6 sm:p-8">
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-2xl" />
            <div className="absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-cyan-500/10 blur-2xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Academic Results
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                  Review your child&apos;s subject performance, grades,
                  scores, and academic progress.
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadResults(studentId, sessionId, termId)}
                disabled={loading}
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {loading && !data ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--muted)]" />
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--muted)]" />
                <div className="h-3 w-48 animate-pulse rounded bg-[var(--muted)]" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-red-800 dark:text-red-300">
                  Unable to load results
                </h2>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadResults(studentId, sessionId, termId)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            <section className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Search className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold">Result Filters</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Choose the child and academic period to review.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="student"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Child
                  </label>

                  <select
                    id="student"
                    value={studentId}
                    onChange={handleStudentChange}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {data?.children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.first_name} {child.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="session"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Academic Session
                  </label>

                  <select
                    id="session"
                    value={sessionId}
                    onChange={handleSessionChange}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">All Sessions</option>

                    {data?.sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="term"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Term
                  </label>

                  <select
                    id="term"
                    value={termId}
                    onChange={handleTermChange}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">All Terms</option>

                    {data?.terms.map((term) => (
                      <option key={term.id} value={term.id}>
                        {term.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {selectedChild && (
              <section className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-5 text-white sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-white/20">
                        {selectedChild.first_name.charAt(0)}
                        {selectedChild.last_name.charAt(0)}
                      </div>

                      <div>
                        <h2 className="text-xl font-bold">
                          {selectedChild.first_name}{" "}
                          {selectedChild.other_name
                            ? `${selectedChild.other_name} `
                            : ""}
                          {selectedChild.last_name}
                        </h2>

                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-indigo-100">
                          <span>
                            {selectedChild.class_name || "Class not assigned"}
                          </span>

                          <span>
                            Admission No: {selectedChild.admission_number}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
                      <UserRound className="h-3.5 w-3.5" />
                      {selectedChild.relationship || "Child"}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <BookOpen className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-4 text-sm font-medium text-[var(--muted-foreground)]">
                  Subjects
                </p>

                <p className="mt-1 text-3xl font-bold">{totalSubjects}</p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
                  <BarChart3 className="h-5 w-5" />
                </div>

                <p className="mt-4 text-sm font-medium text-[var(--muted-foreground)]">
                  Average Score
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {average.toFixed(2)}%
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <Award className="h-5 w-5" />
                </div>

                <p className="mt-4 text-sm font-medium text-[var(--muted-foreground)]">
                  A Grades
                </p>

                <p className="mt-1 text-3xl font-bold">{gradeCounts.a}</p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <p className="mt-4 text-sm font-medium text-[var(--muted-foreground)]">
                  Total Score
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {totalScore.toFixed(2)}
                </p>
              </div>
            </section>

            {data?.results.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--muted-foreground)]">
                  <BookOpen className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-lg font-bold">
                  No Results Found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
                  There are no academic results available for the selected
                  child and academic filters.
                </p>
              </section>
            ) : (
              <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
                <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <GraduationCap className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="font-semibold">Subject Results</h2>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Detailed scores and grades for the selected period.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-[var(--muted)]">
                      <tr>
                        <th className="px-5 py-3.5 text-left font-semibold">
                          Subject
                        </th>
                        <th className="px-5 py-3.5 text-left font-semibold">
                          Session
                        </th>
                        <th className="px-5 py-3.5 text-left font-semibold">
                          Term
                        </th>
                        <th className="px-5 py-3.5 text-left font-semibold">
                          CA
                        </th>
                        <th className="px-5 py-3.5 text-left font-semibold">
                          Exam
                        </th>
                        <th className="px-5 py-3.5 text-left font-semibold">
                          Total
                        </th>
                        <th className="px-5 py-3.5 text-left font-semibold">
                          Grade
                        </th>
                        <th className="px-5 py-3.5 text-left font-semibold">
                          Remarks
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data?.results.map((result) => (
                        <tr
                          key={result.id}
                          className="border-t border-[var(--border)] transition hover:bg-[var(--muted)]/50"
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold">
                              {result.subject_name}
                            </div>

                            {result.subject_code && (
                              <div className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                                {result.subject_code}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-[var(--muted-foreground)]">
                            {result.session_name}
                          </td>

                          <td className="px-5 py-4 text-[var(--muted-foreground)]">
                            {result.term_name}
                          </td>

                          <td className="px-5 py-4">
                            {Number(result.ca_score).toFixed(2)}
                          </td>

                          <td className="px-5 py-4">
                            {Number(result.exam_score).toFixed(2)}
                          </td>

                          <td className="px-5 py-4 font-bold">
                            {Number(result.total_score).toFixed(2)}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex min-w-10 items-center justify-center rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getGradeClass(
                                result.grade
                              )}`}
                            >
                              {result.grade || "—"}
                            </span>
                          </td>

                          <td className="max-w-xs px-5 py-4 text-[var(--muted-foreground)]">
                            {result.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
