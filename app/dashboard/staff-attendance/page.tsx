"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  QrCode,
  Settings2,
  ShieldCheck,
  UserCheck,
  TrendingUp,
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
  earlyDepartureMinutes: number;
  departedEarly: boolean;
  hoursWorkedMinutes: number | null;
  currentState: "not_clocked_in" | "clocked_in" | "completed";
};

type Summary = {
  totalStaff: number;
  present: number;
  late: number;
  notClockedIn: number;
  clockedIn: number;
  completed: number;
  earlyDepartures: number;
  totalHoursWorkedMinutes: number;
};

type AttendanceResponse = {
  success: boolean;
  date: string;
  timezone: string;
  summary: Summary;
  staff: StaffAttendance[];
  message?: string;
};

type AnalyticsRecord = {
  attendanceId: string;
  date: string;
  staffId: string;
  staffName: string;
  roleTitle: string | null;
  attendanceStatus: string;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  departedEarly: boolean;
  hoursWorkedMinutes: number | null;
  shiftCompleted: boolean;
};

type AnalyticsResponse = {
  success: boolean;
  from: string;
  to: string;
  timezone: string;
  summary: {
    recordedEntries: number;
    lateArrivals: number;
    earlyDepartures: number;
    incompleteShifts: number;
    totalCompletedHoursMinutes: number;
  };
  records: AnalyticsRecord[];
  message?: string;
};

function dateOffset(date: string, offset: number) {
  const value = new Date(date + "T00:00:00.000Z");
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

function exportAnalyticsCsv(data: AnalyticsResponse) {
  const columns = [
    "Date",
    "Staff ID",
    "Staff Name",
    "Role",
    "Attendance Status",
    "Late Minutes",
    "Early Departure Minutes",
    "Shift Completed",
    "Hours Worked",
    "Timezone",
  ];

  const escapeCsv = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };

  const rows = data.records.map((record) => [
    record.date,
    record.staffId,
    record.staffName,
    record.roleTitle || "Staff",
    record.attendanceStatus,
    record.lateMinutes,
    record.earlyDepartureMinutes,
    record.shiftCompleted ? "Yes" : "No",
    record.hoursWorkedMinutes === null
      ? ""
      : formatDuration(record.hoursWorkedMinutes),
    data.timezone,
  ]);

  const csv = [columns, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `staff-attendance-report-${data.from}-to-${data.to}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

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

  if (member.departedEarly) {
    return "Early departure";
  }

  if (member.currentState === "completed") {
    return member.attendanceStatus === "late"
      ? "Late · Completed"
      : "Completed";
  }

  return member.attendanceStatus === "late" ? "Late" : "Clocked in";
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return "—";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

function exportAttendanceCsv(data: AttendanceResponse) {
  const columns = [
    "Date",
    "Staff ID",
    "Staff Name",
    "Role",
    "Status",
    "Clock In",
    "Clock Out",
    "Late Minutes",
    "Early Departure Minutes",
    "Hours Worked",
  ];

  const escapeCsv = (value: unknown) =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';

  const rows = data.staff.map((member) => [
    data.date,
    member.staffId,
    member.fullName,
    member.roleTitle || "Staff",
    statusLabel(member),
    member.clockInAt
      ? new Date(member.clockInAt).toLocaleString("en-NG", {
          timeZone: data.timezone,
        })
      : "",
    member.clockOutAt
      ? new Date(member.clockOutAt).toLocaleString("en-NG", {
          timeZone: data.timezone,
        })
      : "",
    member.lateMinutes,
    member.earlyDepartureMinutes,
    member.hoursWorkedMinutes === null
      ? ""
      : formatDuration(member.hoursWorkedMinutes),
  ]);

  const csv = [columns, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const blob = new Blob(["\\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `staff-attendance-${data.date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function StaffAttendancePage() {
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAttendance = useCallback(
    async (selectedDate: string, query: string) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          date: selectedDate,
          search: query,
        });

        const response = await fetch(
          `/api/school/staff-attendance?${params.toString()}`,
          { cache: "no-store" },
        );

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load staff attendance.");
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load staff attendance.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAttendance(date, search);
    }, 350);

    return () => clearTimeout(timer);
  }, [date, search, loadAttendance]);

  const [reportTo, setReportTo] = useState(today);
  const [reportFrom, setReportFrom] = useState(() => dateOffset(today, -89));
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      const fromTime = Date.parse(`${reportFrom}T00:00:00.000Z`);
      const toTime = Date.parse(`${reportTo}T00:00:00.000Z`);
      const rangeDays = Math.floor((toTime - fromTime) / 86_400_000) + 1;

      if (reportFrom > reportTo) {
        setAnalytics(null);
        setAnalyticsError("The start date must be on or before the end date.");
        setAnalyticsLoading(false);
        return;
      }

      if (rangeDays > 366) {
        setAnalytics(null);
        setAnalyticsError("The report range cannot exceed 366 days.");
        setAnalyticsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          from: reportFrom,
          to: reportTo,
          search,
        });

        const response = await fetch(
          `/api/school/staff-attendance/history?${params.toString()}`,
          { cache: "no-store", signal: controller.signal },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load attendance analytics.",
          );
        }

        setAnalytics(result);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;

        setAnalyticsError(
          err instanceof Error
            ? err.message
            : "Unable to load attendance analytics.",
        );
      } finally {
        if (!controller.signal.aborted) setAnalyticsLoading(false);
      }
    }

    void loadAnalytics();
    return () => controller.abort();
  }, [reportFrom, reportTo, search]);

  const analyticsMetrics = useMemo(() => {
    const records = analytics?.records ?? [];
    const monthly = new Map<
      string,
      {
        month: string;
        entries: number;
        late: number;
        early: number;
      }
    >();

    const staff = new Map<
      string,
      {
        staffId: string;
        staffName: string;
        roleTitle: string;
        entries: number;
        late: number;
        lateMinutes: number;
        early: number;
        incomplete: number;
      }
    >();

    for (const record of records) {
      const month = record.date.slice(0, 7);
      const monthItem = monthly.get(month) ?? {
        month,
        entries: 0,
        late: 0,
        early: 0,
      };

      monthItem.entries += 1;
      if (record.attendanceStatus === "late") monthItem.late += 1;
      if (record.departedEarly) monthItem.early += 1;
      monthly.set(month, monthItem);

      const key = record.staffId;
      const staffItem = staff.get(key) ?? {
        staffId: record.staffId,
        staffName: record.staffName,
        roleTitle: record.roleTitle || "Staff",
        entries: 0,
        late: 0,
        lateMinutes: 0,
        early: 0,
        incomplete: 0,
      };

      staffItem.entries += 1;
      if (record.attendanceStatus === "late") {
        staffItem.late += 1;
        staffItem.lateMinutes += record.lateMinutes;
      }
      if (record.departedEarly) staffItem.early += 1;
      if (!record.shiftCompleted) staffItem.incomplete += 1;
      staff.set(key, staffItem);
    }

    const months = [...monthly.values()].sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    const staffList = [...staff.values()];

    const topLate = [...staffList]
      .filter((member) => member.late > 0)
      .sort((a, b) => b.late - a.late || b.lateMinutes - a.lateMinutes)
      .slice(0, 5);

    const topEarly = [...staffList]
      .filter((member) => member.early > 0)
      .sort((a, b) => b.early - a.early)
      .slice(0, 5);

    const topIncomplete = [...staffList]
      .filter((member) => member.incomplete > 0)
      .sort((a, b) => b.incomplete - a.incomplete)
      .slice(0, 5);

    const total = records.length;
    const late = records.filter(
      (record) => record.attendanceStatus === "late",
    ).length;

    return {
      months,
      topLate,
      topEarly,
      topIncomplete,
      total,
      late,
      onTimeRate: total ? Math.round(((total - late) / total) * 100) : 0,
    };
  }, [analytics]);

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
      {
        label: "Early departures",
        value: summary?.earlyDepartures ?? 0,
        icon: Clock3,
        className: "bg-warning/10 text-warning",
      },
      {
        label: "Hours worked",
        value: formatDuration(summary?.totalHoursWorkedMinutes ?? null),
        icon: UserCheck,
        className: "bg-primary/10 text-primary",
      },
    ],
    [summary],
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
              href="/dashboard/staff-attendance/history"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-muted"
            >
              <History className="h-4 w-4" />
              Attendance history
            </Link>

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

            <button
              type="button"
              onClick={() => data && exportAttendanceCsv(data)}
              disabled={!data || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

        <section className="space-y-5 rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">
                  Attendance reports & analytics
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Historical performance based on recorded attendance shifts.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                From
                <input
                  type="date"
                  value={reportFrom}
                  max={reportTo}
                  onChange={(event) => setReportFrom(event.target.value)}
                  className="h-10 rounded-xl border bg-background px-3 text-sm text-foreground"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                To
                <input
                  type="date"
                  value={reportTo}
                  min={reportFrom}
                  max={today}
                  onChange={(event) => setReportTo(event.target.value)}
                  className="h-10 rounded-xl border bg-background px-3 text-sm text-foreground"
                />
              </label>
              <button
                type="button"
                onClick={() => analytics && exportAnalyticsCsv(analytics)}
                disabled={
                  !analytics ||
                  analyticsLoading ||
                  analytics.records.length === 0
                }
                className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export report
              </button>
            </div>
          </div>

          {analyticsError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {analyticsError}
            </div>
          )}

          {reportFrom > reportTo && (
            <p className="text-sm text-destructive">
              The start date must be on or before the end date.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Recorded shifts",
                value: analyticsMetrics.total,
                detail: "Attendance records found",
              },
              {
                label: "Late arrivals",
                value: analytics?.summary.lateArrivals ?? 0,
                detail: "Recorded shifts marked late",
              },
              {
                label: "Shifts not marked late",
                value: analyticsMetrics.total
                  ? `${analyticsMetrics.onTimeRate}%`
                  : "—",
                detail: "Among recorded shifts only",
              },
              {
                label: "Early departures",
                value: analytics?.summary.earlyDepartures ?? 0,
                detail: "Against configured clock-out time",
              },
              {
                label: "Incomplete shifts",
                value: analytics?.summary.incompleteShifts ?? 0,
                detail: "Missing a clock-in or clock-out",
              },
              {
                label: "Completed hours",
                value: formatDuration(
                  analytics?.summary.totalCompletedHoursMinutes ?? null,
                ),
                detail: "From completed recorded shifts",
              },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border bg-background p-4"
              >
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight">
                  {analyticsLoading && !analytics ? "…" : metric.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Monthly attendance trends</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Counts of recorded shifts, late arrivals, and early departures.
              </p>

              {analyticsMetrics.months.length ? (
                <div className="mt-5 space-y-5">
                  {analyticsMetrics.months.map((month) => {
                    const max = Math.max(
                      1,
                      ...analyticsMetrics.months.map((item) => item.entries),
                    );
                    const label = new Intl.DateTimeFormat("en", {
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(month.month + "-01T00:00:00Z"));

                    return (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium">{label}</span>
                          <span className="text-muted-foreground">
                            {month.entries} shifts
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(month.entries / max) * 100}%` }}
                          />
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Late: {month.late}</span>
                          <span>Early departure: {month.early}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {analyticsLoading
                    ? "Loading monthly trends…"
                    : "No recorded shifts in this period."}
                </p>
              )}
            </div>

            <div className="rounded-2xl border p-4 sm:p-5">
              <h3 className="font-semibold">Staff requiring attention</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Staff with the most recorded late arrivals in this period.
              </p>

              {analyticsMetrics.topLate.length ? (
                <div className="mt-4 divide-y">
                  {analyticsMetrics.topLate.map((member, index) => (
                    <div
                      key={member.staffId}
                      className="flex items-center gap-3 py-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-sm font-bold text-warning">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {member.staffName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.staffId} · {member.roleTitle}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold">
                        {member.late} late
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {analyticsLoading
                    ? "Loading staff rankings…"
                    : "No recorded late arrivals in this period."}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {[
              {
                title: "Early departure ranking",
                field: "early" as const,
                empty: "No recorded early departures.",
              },
              {
                title: "Incomplete shift ranking",
                field: "incomplete" as const,
                empty: "No incomplete shifts recorded.",
              },
            ].map((ranking) => {
              const members =
                ranking.field === "early"
                  ? analyticsMetrics.topEarly
                  : analyticsMetrics.topIncomplete;

              return (
                <div
                  key={ranking.title}
                  className="rounded-2xl border p-4 sm:p-5"
                >
                  <h3 className="font-semibold">{ranking.title}</h3>
                  {members.length ? (
                    <div className="mt-3 divide-y">
                      {members.map((member) => (
                        <div
                          key={member.staffId}
                          className="flex items-center justify-between gap-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {member.staffName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.staffId} · {member.roleTitle}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold">
                            {member[ranking.field]}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-sm text-muted-foreground">
                      {analyticsLoading ? "Loading…" : ranking.empty}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Report period: {reportFrom} to {reportTo}. Results reflect recorded
            shifts only. Missing records are not classified as absences. The
            on-time share is not an overall attendance rate.
          </p>
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
                  <th className="px-5 py-4 font-semibold">Departure</th>
                  <th className="px-5 py-4 font-semibold">Hours worked</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading && !data ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16">
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
                              <p className="font-semibold">{member.fullName}</p>

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

                        <td className="px-5 py-4">
                          {member.departedEarly ? (
                            <span className="font-semibold text-warning">
                              {member.earlyDepartureMinutes} min early
                            </span>
                          ) : member.clockOutAt ? (
                            <span className="text-success">
                              On time or later
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          {formatDuration(member.hoursWorkedMinutes)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-5 py-16">
                      <div className="mx-auto flex max-w-md flex-col items-center text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                          <Clock3 className="h-6 w-6" />
                        </div>

                        <h3 className="mt-4 font-semibold">
                          No attendance records yet
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Active staff members will appear here as they use the
                          secure attendance QR system.
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

              <span>Timezone: {data?.timezone || "Africa/Lagos"}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
