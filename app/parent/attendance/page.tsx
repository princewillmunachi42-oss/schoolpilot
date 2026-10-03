"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  admission_number: string | null;
  class_name: string | null;
  relationship: string | null;
};

type Session = {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

type Term = {
  id: string;
  name: string;
  academic_session_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
};

type AttendanceRecord = {
  id: string;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks: string | null;
  academic_session_id: string;
  term_id: string;
  session_name: string;
  term_name: string;
};

function ParentAttendanceContent() {
  const searchParams = useSearchParams();
  const initialStudent = searchParams.get("student") || "";

  const [children, setChildren] = useState<Child[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const [studentId, setStudentId] = useState(initialStudent);
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAttendance(studentId, sessionId, termId);
  }, []);

  async function loadAttendance(
    selectedStudent: string,
    selectedSession: string,
    selectedTerm: string
  ) {
    setLoading(true);
    setError("");

    try {
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
        `/api/parent/attendance?${params.toString()}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load attendance."
        );
      }

      setChildren(result.children || []);
      setSessions(result.sessions || []);
      setTerms(result.terms || []);
      setRecords(result.records || []);

      if (!selectedStudent && result.selectedStudentId) {
        setStudentId(result.selectedStudentId);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleStudentChange(value: string) {
    setStudentId(value);
    setTermId("");
    loadAttendance(value, sessionId, "");
  }

  function handleSessionChange(value: string) {
    setSessionId(value);
    setTermId("");
    loadAttendance(studentId, value, "");
  }

  function handleTermChange(value: string) {
    setTermId(value);
    loadAttendance(studentId, sessionId, value);
  }

  const selectedChild = children.find(
    (child) => child.id === studentId
  );

  const summary = useMemo(() => {
    return {
      present: records.filter((record) => record.status === "present")
        .length,
      absent: records.filter((record) => record.status === "absent")
        .length,
      late: records.filter((record) => record.status === "late")
        .length,
      excused: records.filter(
        (record) => record.status === "excused"
      ).length,
    };
  }, [records]);

  const attendanceRate =
    records.length > 0
      ? Math.round(
          ((summary.present + summary.excused) / records.length) * 100
        )
      : 0;

  function statusClass(status: AttendanceRecord["status"]) {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700";
      case "absent":
        return "bg-red-100 text-red-700";
      case "late":
        return "bg-yellow-100 text-yellow-700";
      case "excused":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading && children.length === 0) {
    return (
      <main className="min-h-screen p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-gray-500">
            Loading attendance...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/parent"
          className="inline-flex text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Parent Dashboard
        </Link>

        <header>
          <p className="text-sm text-gray-500">Parent Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View attendance records for your linked children.
          </p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
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
                  handleStudentChange(event.target.value)
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {[
                      child.first_name,
                      child.other_name,
                      child.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ")}
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
                  handleSessionChange(event.target.value)
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">All Sessions</option>

                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
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
                  handleTermChange(event.target.value)
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">All Terms</option>

                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {selectedChild && (
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div>
              <p className="text-sm text-gray-500">Selected Child</p>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">
                {[
                  selectedChild.first_name,
                  selectedChild.other_name,
                  selectedChild.last_name,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </h2>

              {selectedChild.class_name && (
                <p className="mt-1 text-sm text-gray-500">
                  {selectedChild.class_name}
                </p>
              )}
            </div>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Attendance Rate</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {attendanceRate}%
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Present</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {summary.present}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Absent</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {summary.absent}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Late</p>
            <p className="mt-1 text-2xl font-bold text-yellow-600">
              {summary.late}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Excused</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {summary.excused}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Attendance Records
            </h2>
          </div>

          {records.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No attendance records found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Date
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Session
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Term
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-5 py-3 font-medium text-gray-600">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-5 py-4 text-gray-900">
                        {record.attendance_date.slice(0, 10)}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {record.session_name}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {record.term_name}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(
                            record.status
                          )}`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {record.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
export default function ParentAttendancePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading attendance...</div>}>
      <ParentAttendanceContent />
    </Suspense>
  );
}
