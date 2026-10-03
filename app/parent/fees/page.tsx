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
};

type Term = {
  id: string;
  name: string;
  academic_session_id: string;
};

type Fee = {
  id: string;
  fee_name: string;
  amount_due: number;
  amount_paid: number;
  balance: number;
  due_date?: string | null;
  status: string;
  remarks?: string | null;
  academic_session_id: string;
  term_id: string;
  session_name: string;
  term_name: string;
};

type FeesResponse = {
  success: boolean;
  message?: string;
  children: Child[];
  selectedStudentId?: string;
  sessions: Session[];
  terms: Term[];
  fees: Fee[];
};

function formatAmount(value: number) {
  return `₦${Number(value || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: string) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300";

    case "partial":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300";

    case "overdue":
      return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";

    case "waived":
      return "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300";

    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  }
}

export default function ParentFeesPage() {
  const [data, setData] = useState<FeesResponse | null>(null);
  const [studentId, setStudentId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFees(
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
        `/api/parent/fees?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load fee information."
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
          : "Unable to load fee information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleStudentChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;

    setStudentId(value);
    loadFees(value, sessionId, termId);
  }

  function handleSessionChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;

    setSessionId(value);
    setTermId("");

    loadFees(studentId, value, "");
  }

  function handleTermChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;

    setTermId(value);
    loadFees(studentId, sessionId, value);
  }

  const selectedChild = data?.children.find(
    (child) => child.id === studentId
  );

  const fees = data?.fees || [];

  const totalDue = fees.reduce(
    (sum, fee) => sum + Number(fee.amount_due || 0),
    0
  );

  const totalPaid = fees.reduce(
    (sum, fee) => sum + Number(fee.amount_paid || 0),
    0
  );

  const totalBalance = fees.reduce(
    (sum, fee) => sum + Number(fee.balance || 0),
    0
  );

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
            School Fees
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your child&apos;s school fees, payments and
            outstanding balances.
          </p>
        </div>

        {loading && !data ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <p>Loading fee information...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <p>{error}</p>

            <button
              type="button"
              onClick={() =>
                loadFees(studentId, sessionId, termId)
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

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Due
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {formatAmount(totalDue)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Paid
                </p>

                <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(totalPaid)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Outstanding Balance
                </p>

                <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatAmount(totalBalance)}
                </p>
              </div>
            </div>

            {fees.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-lg font-semibold">
                  No Fee Records Found
                </h2>

                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  There are no school fee records available
                  for the selected filters.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                          Fee
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Session
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Term
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Due
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Paid
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Balance
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Due Date
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Status
                        </th>

                        <th className="px-4 py-3 text-left font-semibold">
                          Remarks
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {fees.map((fee) => (
                        <tr
                          key={fee.id}
                          className="border-t border-gray-200 dark:border-gray-800"
                        >
                          <td className="px-4 py-4 font-medium">
                            {fee.fee_name}
                          </td>

                          <td className="px-4 py-4">
                            {fee.session_name}
                          </td>

                          <td className="px-4 py-4">
                            {fee.term_name}
                          </td>

                          <td className="px-4 py-4">
                            {formatAmount(fee.amount_due)}
                          </td>

                          <td className="px-4 py-4 text-green-600 dark:text-green-400">
                            {formatAmount(fee.amount_paid)}
                          </td>

                          <td className="px-4 py-4 font-semibold">
                            {formatAmount(fee.balance)}
                          </td>

                          <td className="px-4 py-4">
                            {formatDate(fee.due_date)}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                                fee.status
                              )}`}
                            >
                              {statusLabel(fee.status)}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {fee.remarks || "—"}
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
