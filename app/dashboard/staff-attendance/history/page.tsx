"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

type AttendanceRecord = {
  attendanceId: string;
  date: string;
  staffId: string;
  staffName: string;
  roleTitle: string | null;
  clockInAt: string | null;
  clockOutAt: string | null;
  attendanceStatus: string | null;
  lateMinutes: number;
  earlyDepartureMinutes: number;
  departedEarly: boolean;
  hoursWorkedMinutes: number | null;
  shiftCompleted: boolean;
};

type HistoryResponse = {
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
  records: AttendanceRecord[];
  message?: string;
};

type Filters = {
  from: string;
  to: string;
  search: string;
};

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Lagos",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const initialFilters: Filters = {
  from: `${today.slice(0, 7)}-01`,
  to: today,
  search: "",
};

function formatDate(value: string) {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null, timezone: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("en-NG", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "—";
  }
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return "—";

  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;

  if (hours === 0) return `${remaining}m`;
  if (remaining === 0) return `${hours}h`;

  return `${hours}h ${remaining}m`;
}

function statusLabel(record: AttendanceRecord) {
  if (record.attendanceStatus === "late") return "Late";
  if (record.attendanceStatus === "present") return "Present";
  return record.attendanceStatus || "Recorded";
}

function exportCsv(data: HistoryResponse) {
  const columns = [
    "Attendance ID",
    "Date",
    "Staff ID",
    "Staff Name",
    "Role",
    "Attendance Status",
    "Clock In",
    "Clock Out",
    "Late Minutes",
    "Early Departure Minutes",
    "Shift Completed",
    "Hours Worked",
    "Timezone",
  ];

  function escapeCsv(value: unknown) {
    let text = String(value ?? "");

    // Prevent spreadsheet formula execution for untrusted text fields.
    if (/^[\u0000-\u0020]*[=+\-@]/.test(text)) {
      text = `'${text}`;
    }

    return `"${text.replace(/"/g, '""')}"`;
  }

  const rows = data.records.map((record) => [
    record.attendanceId,
    record.date,
    record.staffId,
    record.staffName,
    record.roleTitle || "Staff",
    statusLabel(record),
    record.clockInAt
      ? formatTime(record.clockInAt, data.timezone)
      : "",
    record.clockOutAt
      ? formatTime(record.clockOutAt, data.timezone)
      : "",
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

  // Actual UTF-8 BOM for spreadsheet compatibility.
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `staff-attendance-${data.from}-to-${data.to}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function StaffAttendanceHistoryPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<Filters>(initialFilters);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          from: appliedFilters.from,
          to: appliedFilters.to,
          search: appliedFilters.search,
        });

        const response = await fetch(
          `/api/school/staff-attendance/history?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = (await response.json()) as HistoryResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load attendance history."
          );
        }

        if (active) setData(result);
      } catch (err) {
        if (
          err instanceof Error &&
          err.name === "AbortError"
        ) {
          return;
        }

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load attendance history."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadHistory();

    return () => {
      active = false;
      controller.abort();
    };
  }, [appliedFilters]);

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilterError("");

    if (!filters.from || !filters.to) {
      setFilterError("Choose both a start date and an end date.");
      return;
    }

    if (filters.from > filters.to) {
      setFilterError("The start date cannot be after the end date.");
      return;
    }

    const days =
      Math.floor(
        (
          Date.parse(`${filters.to}T00:00:00Z`) -
          Date.parse(`${filters.from}T00:00:00Z`)
        ) / 86_400_000
      ) + 1;

    if (days > 366) {
      setFilterError("Choose a date range of 366 days or less.");
      return;
    }

    setAppliedFilters({
      ...filters,
      search: filters.search.trim(),
    });
  }

  const stats = [
    {
      label: "Recorded entries",
      value: data?.summary.recordedEntries ?? 0,
      icon: Users,
      description: "Attendance records found",
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Late arrivals",
      value: data?.summary.lateArrivals ?? 0,
      icon: Clock3,
      description: "Records marked late",
      iconClass: "bg-warning/10 text-warning",
    },
    {
      label: "Early departures",
      value: data?.summary.earlyDepartures ?? 0,
      icon: History,
      description: "Departures before schedule",
      iconClass: "bg-warning/10 text-warning",
    },
    {
      label: "Incomplete shifts",
      value: data?.summary.incompleteShifts ?? 0,
      icon: AlertCircle,
      description: "Missing clock-in or clock-out",
      iconClass: "bg-muted text-muted-foreground",
    },
    {
      label: "Completed hours",
      value: formatDuration(
        data?.summary.totalCompletedHoursMinutes ?? 0
      ),
      icon: CheckCircle2,
      description: "Combined completed shifts",
      iconClass: "bg-success/10 text-success",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/staff-attendance"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Daily attendance
          </Link>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/staff-attendance/settings"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium transition hover:bg-muted"
            >
              <ShieldCheck className="h-4 w-4" />
              Settings
            </Link>

            <Link
              href="/dashboard/staff-attendance/qr"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium transition hover:bg-muted"
            >
              <CalendarDays className="h-4 w-4" />
              Attendance QR
            </Link>
          </div>
        </div>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-primary">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Attendance reports
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Staff attendance history
            </h1>

            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Review recorded staff attendance across any date range,
              identify attendance patterns, and export reports for your
              school.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setAppliedFilters({ ...appliedFilters })
            }
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh report
          </button>
        </header>

        <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold">Report filters</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a date range and optionally search for a staff member.
              </p>
            </div>
          </div>

          <form onSubmit={applyFilters} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1.5fr_auto] xl:items-end">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-medium">
                  Start date
                </span>
                <input
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  required
                  onChange={(event) =>
                    updateFilter("from", event.target.value)
                  }
                  className="h-11 w-full min-w-0 rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-medium">
                  End date
                </span>
                <input
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  max={today}
                  required
                  onChange={(event) =>
                    updateFilter("to", event.target.value)
                  }
                  className="h-11 w-full min-w-0 rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-medium">
                  Search staff
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={filters.search}
                    onChange={(event) =>
                      updateFilter("search", event.target.value)
                    }
                    placeholder="Name, staff ID, or role"
                    className="h-11 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                Apply filters
              </button>
            </div>

            {filterError && (
              <p role="alert" className="text-sm text-destructive">
                {filterError}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Reports can cover up to 366 days. Only recorded attendance
              entries are included; staff without a record are not counted
              as confirmed absences.
            </p>
          </form>
        </section>

        {error && (
          <section
            role="alert"
            className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold">Report could not be loaded</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setAppliedFilters({ ...appliedFilters })
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <p className="mt-4 text-sm text-muted-foreground">
                  {stat.label}
                </p>

                <p className="mt-1 break-words text-2xl font-bold tracking-tight">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-lg font-bold">Attendance records</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {data
                  ? `${formatDate(data.from)} – ${formatDate(data.to)}`
                  : "Your selected reporting period"}
                {data ? ` · ${data.timezone}` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => data && exportCsv(data)}
              disabled={loading || !data || data.records.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
              {data && ` (${data.records.length})`}
            </button>
          </div>

          <div className="relative">
            {loading && data && (
              <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/10">
                <div className="h-full w-1/3 animate-pulse bg-primary" />
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-4 font-semibold sm:px-5">Date</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Staff member</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Role</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Status</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Clock in</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Clock out</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Late</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Departure</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Duration</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {loading && !data ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-16">
                        <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Loading attendance history…
                        </div>
                      </td>
                    </tr>
                  ) : data?.records.length ? (
                    data.records.map((record) => (
                      <tr
                        key={record.attendanceId}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground sm:px-5">
                          {formatDate(record.date)}
                        </td>

                        <td className="px-4 py-4 sm:px-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <UserRound className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold">{record.staffName}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                ID: {record.staffId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-muted-foreground sm:px-5">
                          {record.roleTitle || "Staff"}
                        </td>

                        <td className="px-4 py-4 sm:px-5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              record.attendanceStatus === "late"
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            {statusLabel(record)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                          {formatTime(record.clockInAt, data.timezone)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 sm:px-5">
                          {formatTime(record.clockOutAt, data.timezone)}
                        </td>

                        <td className="px-4 py-4 sm:px-5">
                          {record.attendanceStatus === "late" ? (
                            <span className="font-semibold text-warning">
                              {record.lateMinutes} min
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="px-4 py-4 sm:px-5">
                          {record.departedEarly ? (
                            <span className="font-semibold text-warning">
                              {record.earlyDepartureMinutes} min early
                            </span>
                          ) : record.clockOutAt ? (
                            <span className="text-success">On time or later</span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 font-medium sm:px-5">
                          {formatDuration(record.hoursWorkedMinutes)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-5 py-16">
                        <div className="mx-auto flex max-w-md flex-col items-center text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                            <CalendarRange className="h-6 w-6" />
                          </div>

                          <h3 className="mt-4 font-semibold">
                            {error
                              ? "Attendance records unavailable"
                              : "No recorded attendance"}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {error
                              ? "Check your connection and try loading the report again."
                              : "No matching attendance entries were found for this period. Try a different date range or search term."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>
              {loading
                ? "Updating report…"
                : `Showing ${data?.records.length ?? 0} recorded attendance ${
                    (data?.records.length ?? 0) === 1 ? "entry" : "entries"
                  }`}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              School-scoped report · {data?.timezone || "Africa/Lagos"}
            </span>
          </footer>
        </section>
      </div>
    </main>
  );
}
