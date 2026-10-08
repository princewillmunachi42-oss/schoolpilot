"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  QrCode,
  Settings2,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

type StaffAttendance = {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  roleTitle: string | null;
  photoUrl: string | null;
  status: string;
  attendanceId: string | null;
  clockInAt: string | null;
  clockOutAt: string | null;
  attendanceStatus: "present" | "late" | null;
  lateMinutes: number;
  currentState: "not_clocked_in" | "clocked_in" | "completed";
};

type Summary = {
  totalStaff: number;
  present: number;
  late: number;
  notClockedIn: number;
  clockedIn: number;
  completed: number;
};

type AttendanceResponse = {
  success: boolean;
  date: string;
  timezone: string;
  summary: Summary;
  staff: StaffAttendance[];
  message?: string;
};

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Lagos",
}).format(new Date());

function formatTime(value: string | null, timezone: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(member: StaffAttendance) {
  if (member.currentState === "not_clocked_in") {
    return "Not clocked in";
  }

  if (member.currentState === "completed") {
    return member.attendanceStatus === "late"
      ? "Late · Completed"
      : "Completed";
  }

  return member.attendanceStatus === "late" ? "Late" : "Clocked in";
}

export default function StaffAttendancePage() {
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttendance(selectedDate = date, query = search) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        date: selectedDate,
        search: query,
      });

      const response = await fetch(
        `/api/school/staff-attendance?${params.toString()}`,
        { cache: "no-store" }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load staff attendance."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load staff attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAttendance(date, search);
    }, 350);

    return () => clearTimeout(timer);
  }, [date, search]);

  const summary = data?.summary;

  const stats = useMemo(
    () => [
      {
        label: "Total staff",
        value: summary?.totalStaff ?? 0,
        icon: Users,
        className: "bg-primary/10 text-primary",
      },
      {
        label: "Present",
        value: summary?.present ?? 0,
        icon: CheckCircle2,
        className: "bg-success/10 text-success",
      },
      {
        label: "Late",
        value: summary?.late ?? 0,
        icon: AlertCircle,
        className: "bg-warning/10 text-warning",
      },
      {
        label: "Not clocked in",
        value: summary?.notClockedIn ?? 0,
        icon: XCircle,
        className: "bg-destructive/10 text-destructive",
      },
    ],
    [summary]
  );

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <p className="text-sm font-semibold text-primary">
                  Staff Attendance
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Attendance control center
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Monitor staff arrival and departure in real time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/staff-attendance/qr"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              <QrCode className="h-4 w-4" />
              Display attendance QR
            </Link>

            <Link
              href="/dashboard/staff-attendance/settings"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-muted"
            >
              <Settings2 className="h-4 w-4" />
              Attendance settings
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.className}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <p className="mt-5 text-sm text-muted-foreground">
                  {stat.label}
                </p>

                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="border-b p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold">Daily attendance</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Review attendance records for the selected school day.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative block">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="h-11 rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

                <label className="relative block sm:min-w-[260px]">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search staff..."
                    className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">Staff</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Clock in</th>
                  <th className="px-5 py-4 font-semibold">Clock out</th>
                  <th className="px-5 py-4 font-semibold">Late</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading && !data ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16">
                      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading attendance...
                      </div>
                    </td>
                  </tr>
                ) : data?.staff.length ? (
                  data.staff.map((member) => {
                    const late = member.attendanceStatus === "late";

                    return (
                      <tr
                        key={member.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {member.photoUrl ? (
                              <img
                                src={member.photoUrl}
                                alt=""
                                className="h-10 w-10 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">
                                {member.firstName.charAt(0)}
                                {member.lastName.charAt(0)}
                              </div>
                            )}

                            <div>
                              <p className="font-semibold">
                                {member.fullName}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                ID: {member.staffId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {member.roleTitle || "Staff"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              member.currentState === "not_clocked_in"
                                ? "bg-muted text-muted-foreground"
                                : late
                                  ? "bg-warning/10 text-warning"
                                  : "bg-success/10 text-success"
                            }`}
                          >
                            {member.currentState === "not_clocked_in" ? (
                              <XCircle className="h-3.5 w-3.5" />
                            ) : late ? (
                              <AlertCircle className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}

                            {statusLabel(member)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {formatTime(member.clockInAt, data.timezone)}
                        </td>

                        <td className="px-5 py-4">
                          {formatTime(member.clockOutAt, data.timezone)}
                        </td>

                        <td className="px-5 py-4">
                          {late ? (
                            <span className="font-semibold text-warning">
                              {member.lateMinutes} min
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-16">
                      <div className="mx-auto flex max-w-md flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                          <Clock3 className="h-6 w-6" />
                        </div>

                        <h3 className="mt-4 font-semibold">
                          No attendance records yet
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Active staff members will appear here as they use
                          the secure attendance QR system.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t bg-muted/20 px-5 py-4">
            <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {data?.staff.length ?? 0} active staff member
                {(data?.staff.length ?? 0) === 1 ? "" : "s"}
              </span>

              <span>
                Timezone: {data?.timezone || "Africa/Lagos"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
