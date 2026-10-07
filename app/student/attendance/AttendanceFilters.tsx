"use client";

import { useMemo, useState } from "react";

type AttendanceRecord = {
  id: string;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks: string | null;
  session_name: string;
  term_name: string;
};

type Props = {
  attendance: AttendanceRecord[];
};

export default function AttendanceFilters({ attendance }: Props) {
  const [session, setSession] = useState("all");
  const [term, setTerm] = useState("all");
  const [status, setStatus] = useState("all");

  const sessions = useMemo(
    () => [...new Set(attendance.map((item) => item.session_name))],
    [attendance]
  );

  const terms = useMemo(
    () => [...new Set(attendance.map((item) => item.term_name))],
    [attendance]
  );

  const filteredAttendance = attendance.filter((item) => {
    const matchesSession =
      session === "all" || item.session_name === session;

    const matchesTerm =
      term === "all" || item.term_name === term;

    const matchesStatus =
      status === "all" || item.status === status;

    return matchesSession && matchesTerm && matchesStatus;
  });

  function formatDate(value: string) {
    return new Date(`${value}T00:00:00`).toLocaleDateString(
      "en-NG",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function statusLabel(
    value: AttendanceRecord["status"]
  ) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  return (
    <div>
      <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
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
            Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>
      </div>

      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredAttendance.length} of {attendance.length} records
      </div>

      {filteredAttendance.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-medium">
            No attendance records match these filters.
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            Try changing your session, term, or status filter.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {filteredAttendance.map((record) => (
            <div
              key={record.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold">
                  {formatDate(record.attendance_date)}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {record.session_name} • {record.term_name}
                </p>

                {record.remarks && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Remarks: {record.remarks}
                  </p>
                )}
              </div>

              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-semibold ${
                  record.status === "present"
                    ? "bg-green-500/10 text-green-700 dark:text-green-400"
                    : record.status === "absent"
                      ? "bg-destructive/10 text-destructive"
                      : record.status === "late"
                        ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                        : "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                }`}
              >
                {statusLabel(record.status)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
