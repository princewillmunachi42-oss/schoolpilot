"use client";

import { useMemo, useState } from "react";

type ResultRecord = {
  id: string;
  subject_name: string;
  subject_code: string | null;
  session_name: string;
  term_name: string;
  ca_score: string;
  exam_score: string;
  total_score: string;
  grade: string | null;
  remarks: string | null;
};

type Props = {
  results: ResultRecord[];
};

export default function ResultsFilters({ results }: Props) {
  const [session, setSession] = useState("all");
  const [term, setTerm] = useState("all");
  const [subject, setSubject] = useState("all");
  const [grade, setGrade] = useState("all");

  const sessions = useMemo(
    () => [...new Set(results.map((item) => item.session_name))],
    [results]
  );

  const terms = useMemo(
    () => [...new Set(results.map((item) => item.term_name))],
    [results]
  );

  const subjects = useMemo(
    () => [...new Set(results.map((item) => item.subject_name))],
    [results]
  );

  const grades = useMemo(
    () =>
      [...new Set(
        results
          .map((item) => item.grade)
          .filter((item): item is string => Boolean(item))
      )].sort(),
    [results]
  );

  const filteredResults = results.filter((item) => {
    const matchesSession =
      session === "all" || item.session_name === session;

    const matchesTerm =
      term === "all" || item.term_name === term;

    const matchesSubject =
      subject === "all" || item.subject_name === subject;

    const matchesGrade =
      grade === "all" || item.grade === grade;

    return (
      matchesSession &&
      matchesTerm &&
      matchesSubject &&
      matchesGrade
    );
  });

  const filteredTotal = filteredResults.reduce(
    (sum, item) => sum + Number(item.total_score),
    0
  );

  const filteredAverage =
    filteredResults.length > 0
      ? filteredTotal / filteredResults.length
      : 0;

  function gradeClass(value: string | null) {
    switch (value) {
      case "A":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "B":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "C":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "D":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "E":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "F":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Academic Session
          </label>

          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Sessions</option>

            {sessions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Term
          </label>

          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Terms</option>

            {terms.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Subject
          </label>

          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Subjects</option>

            {subjects.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Grade
          </label>

          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Grades</option>

            {grades.map((item) => (
              <option key={item} value={item}>
                Grade {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredResults.length} of {results.length} results
        {filteredResults.length > 0 && (
          <>
            {" "}• Average: {filteredAverage.toFixed(1)}/100
          </>
        )}
      </div>

      {filteredResults.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-medium">
            No results match these filters.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Try changing your session, term, subject, or grade filter.
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-semibold">
              Academic Results
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Your published results from the school.
            </p>
          </div>

          <div className="divide-y divide-border">
            {filteredResults.map((item) => (
              <div key={item.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {item.subject_name}
                    </h3>

                    {item.subject_code && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.subject_code}
                      </p>
                    )}

                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.session_name} • {item.term_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold">
                      {Number(item.total_score).toFixed(1)}
                      <span className="ml-1 text-sm font-medium text-muted-foreground">
                        /100
                      </span>
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${gradeClass(
                        item.grade
                      )}`}
                    >
                      {item.grade ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs text-muted-foreground">
                      CA Score
                    </p>
                    <p className="mt-1 font-semibold">
                      {Number(item.ca_score).toFixed(1)} / 40
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs text-muted-foreground">
                      Exam Score
                    </p>
                    <p className="mt-1 font-semibold">
                      {Number(item.exam_score).toFixed(1)} / 60
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs text-muted-foreground">
                      Total Score
                    </p>
                    <p className="mt-1 font-semibold">
                      {Number(item.total_score).toFixed(1)} / 100
                    </p>
                  </div>
                </div>

                {item.remarks && (
                  <div className="mt-4 rounded-xl border border-border bg-background p-4">
                    <p className="text-xs text-muted-foreground">
                      Remarks
                    </p>
                    <p className="mt-1 text-sm">
                      {item.remarks}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
