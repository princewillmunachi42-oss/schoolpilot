"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
        throw new Error(
          result.message || "Unable to load results."
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
          : "Unable to load results."
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

  const average =
    totalSubjects > 0
      ? totalScore / totalSubjects
      : 0;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/parent"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Parent Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Academic Results
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your child&apos;s academic performance and
            subject results.
          </p>
        </div>

        {loading && !data ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <p>Loading results...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                loadResults(studentId, sessionId, termId)
              }
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="student"
                  className="mb-2 block text-sm font-medium"
                >
                  Child
                </label>

                <select
                  id="student"
                  value={studentId}
                  onChange={handleStudentChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900"
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
                  className="mb-2 block text-sm font-medium"
                >
                  Academic Session
                </label>

                <select
                  id="session"
                  value={sessionId}
                  onChange={handleSessionChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">
                    All Sessions
                  </option>

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
                  className="mb-2 block text-sm font-medium"
                >
                  Term
                </label>

                <select
                  id="term"
                  value={termId}
                  onChange={handleTermChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900"
                >
                  <option value="">
                    All Terms
                  </option>

                  {data?.terms.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedChild && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-xl font-semibold">
                  {selectedChild.first_name}{" "}
                  {selectedChild.other_name
                    ? `${selectedChild.other_name} `
                    : ""}
                  {selectedChild.last_name}
                </h2>

                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Class:{" "}
                    {selectedChild.class_name || "Not assigned"}
                  </span>

                  <span>
                    Admission No:{" "}
                    {selectedChild.admission_number}
                  </span>

                  {selectedChild.relationship && (
                    <span>
                      Relationship:{" "}
                      {selectedChild.relationship}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Subjects
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {totalSubjects}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Average Score
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {average.toFixed(2)}%
                </p>
              </div>
            </div>

            {data?.results.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-lg font-semibold">
                  No Results Found
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  There are no academic results available for
                  the selected filters.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                          Subject
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Session
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Term
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          CA
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Exam
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Total
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Grade
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Remarks
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data?.results.map((result) => (
                        <tr
                          key={result.id}
                          className="border-t border-gray-200 dark:border-gray-800"
                        >
                          <td className="px-4 py-4">
                            <div className="font-medium">
                              {result.subject_name}
                            </div>

                            {result.subject_code && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {result.subject_code}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {result.session_name}
                          </td>

                          <td className="px-4 py-4">
                            {result.term_name}
                          </td>

                          <td className="px-4 py-4">
                            {Number(result.ca_score).toFixed(2)}
                          </td>

                          <td className="px-4 py-4">
                            {Number(result.exam_score).toFixed(2)}
                          </td>

                          <td className="px-4 py-4 font-semibold">
                            {Number(result.total_score).toFixed(2)}
                          </td>

                          <td className="px-4 py-4 font-semibold">
                            {result.grade || "—"}
                          </td>

                          <td className="px-4 py-4">
                            {result.remarks || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
