"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  Info,
  Search,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

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
      present: records.filter(
        (record) => record.status === "present"
      ).length,

      absent: records.filter(
        (record) => record.status === "absent"
      ).length,

      late: records.filter(
        (record) => record.status === "late"
      ).length,

      excused: records.filter(
        (record) => record.status === "excused"
      ).length,
    };
  }, [records]);

  const attendanceRate =
    records.length > 0
      ? Math.round(
          ((summary.present + summary.excused) / records.length) *
            100
        )
      : 0;

  function statusConfig(status: AttendanceRecord["status"]) {
    switch (status) {
      case "present":
        return {
          label: "Present",
          className:
            "bg-success/10 text-success border-success/20",
          icon: CheckCircle2,
        };

      case "absent":
        return {
          label: "Absent",
          className:
            "bg-destructive/10 text-destructive border-destructive/20",
          icon: XCircle,
        };

      case "late":
        return {
          label: "Late",
          className:
            "bg-warning/10 text-warning border-warning/20",
          icon: Clock3,
        };

      case "excused":
        return {
          label: "Excused",
          className:
            "bg-primary/10 text-primary border-primary/20",
          icon: Info,
        };

      default:
        return {
          label: status,
          className: "bg-muted text-muted-foreground",
          icon: Info,
        };
    }
  }

  if (loading && children.length === 0) {
    return (
      <main className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-6 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-40 animate-pulse rounded-3xl border bg-card" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-28 animate-pulse rounded-2xl border bg-card"
              />
            ))}
          </div>

          <div className="h-80 animate-pulse rounded-3xl border bg-card" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back */}
        <Link
          href="/parent"
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Parent Dashboard
        </Link>

        {/* Header */}
        <header className="relative overflow-hidden rounded-3xl border bg-card">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative p-5 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                  Parent Portal
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Attendance
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Monitor attendance records and attendance patterns
                  for your linked children.
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <section className="rounded-3xl border bg-card">
          <div className="border-b px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold">Attendance Filters</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a child, academic session, or term.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
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
                onChange={(event) =>
                  handleStudentChange(event.target.value)
                }
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm transition focus:border-primary"
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
                className="mb-2 block text-sm font-semibold"
              >
                Academic Session
              </label>

              <select
                id="session"
                value={sessionId}
                onChange={(event) =>
                  handleSessionChange(event.target.value)
                }
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm transition focus:border-primary"
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
                className="mb-2 block text-sm font-semibold"
              >
                Term
              </label>

              <select
                id="term"
                value={termId}
                onChange={(event) =>
                  handleTermChange(event.target.value)
                }
                className="h-11 w-full rounded-xl border bg-background px-3 text-sm transition focus:border-primary"
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

        {/* Selected Child */}
        {selectedChild && (
          <section className="rounded-3xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-bold text-primary">
                  {selectedChild.first_name.charAt(0)}
                  {selectedChild.last_name.charAt(0)}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Selected Child
                  </p>

                  <h2 className="mt-1 truncate text-lg font-bold sm:text-xl">
                    {[
                      selectedChild.first_name,
                      selectedChild.other_name,
                      selectedChild.last_name,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  </h2>

                  {selectedChild.class_name && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      {selectedChild.class_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex w-fit items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-semibold">
                <Users className="h-3.5 w-3.5 text-primary" />
                Attendance Record
              </div>
            </div>
          </section>
        )}

        {/* Summary */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight">
              Attendance Summary
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              A quick overview of the selected attendance period.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Attendance Rate
                </p>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold">
                {attendanceRate}%
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Present
                </p>

                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>

              <p className="mt-4 text-3xl font-bold text-success">
                {summary.present}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Absent
                </p>

                <XCircle className="h-5 w-5 text-destructive" />
              </div>

              <p className="mt-4 text-3xl font-bold text-destructive">
                {summary.absent}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Late
                </p>

                <Clock3 className="h-5 w-5 text-warning" />
              </div>

              <p className="mt-4 text-3xl font-bold text-warning">
                {summary.late}
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Excused
                </p>

                <Info className="h-5 w-5 text-primary" />
              </div>

              <p className="mt-4 text-3xl font-bold text-primary">
                {summary.excused}
              </p>
            </div>
          </div>
        </section>

        {/* Records */}
        <section className="rounded-3xl border bg-card">
          <div className="border-b px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">Attendance Records</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Detailed attendance history for the selected filters.
                </p>
              </div>

              <span className="w-fit rounded-full border bg-muted/50 px-3 py-1.5 text-xs font-semibold">
                {records.length}{" "}
                {records.length === 1 ? "record" : "records"}
              </span>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <CalendarDays className="h-7 w-7" />
              </div>

              <h3 className="mt-4 font-semibold">
                No attendance records
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                No attendance records were found for the selected
                child and filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold text-muted-foreground">
                      Date
                    </th>

                    <th className="px-5 py-3.5 font-semibold text-muted-foreground">
                      Session
                    </th>

                    <th className="px-5 py-3.5 font-semibold text-muted-foreground">
                      Term
                    </th>

                    <th className="px-5 py-3.5 font-semibold text-muted-foreground">
                      Status
                    </th>

                    <th className="px-5 py-3.5 font-semibold text-muted-foreground">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((record) => {
                    const status = statusConfig(record.status);
                    const StatusIcon = status.icon;

                    return (
                      <tr
                        key={record.id}
                        className="border-b last:border-b-0 transition hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-medium">
                          {record.attendance_date.slice(0, 10)}
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {record.session_name}
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {record.term_name}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {status.label}
                          </span>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-muted-foreground">
                          {record.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })}
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
    <Suspense
      fallback={
        <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="h-40 animate-pulse rounded-3xl border bg-card" />
          </div>
        </main>
      }
    >
      <ParentAttendanceContent />
    </Suspense>
  );
}
