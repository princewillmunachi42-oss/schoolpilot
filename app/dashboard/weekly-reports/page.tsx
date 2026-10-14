"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowDownToLine,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  RefreshCw,
  Users,
} from "lucide-react";

type ReportData = {
  schoolId: string;
  schoolName: string;
  startDate: string;
  endDate: string;
  summary: {
    activeStudents: number;
    staffCount: number;
    classCount: number;
    attendanceRecords: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendanceRate: number;
    resultsRecorded: number;
    averageScore: number | null;
    passRate: number;
    assignmentsDue: number;
    reportsPublished: number;
  };
  attendanceTrend: {
    day: string;
    total: number;
    present: number;
    absent: number;
    late: number;
  }[];
};

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultStart() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return localDate(date);
}

function prettyDate(value: string) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function compactNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

export default function WeeklyReportsPage() {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(() => localDate(new Date()));
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!start || !end || start > end) {
      setError("The start date must be on or before the end date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/school/weekly-reports?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
        { cache: "no-store" },
      );
      const raw = await response.text();
      let result: ReportData & { error?: string; details?: string };
      try {
        result = JSON.parse(raw) as ReportData & {
          error?: string;
          details?: string;
        };
      } catch {
        throw new Error(
          "Weekly report API returned " +
            response.status +
            ": " +
            raw.slice(0, 300),
        );
      }

      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Failed to load report.",
        );
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const summary = data?.summary;
  const maxAttendance = Math.max(
    1,
    ...(data?.attendanceTrend.map((day) => day.total) ?? []),
  );

  return (
    <main className="weekly-reports mx-auto w-full max-w-7xl space-y-7 p-4 sm:p-6 lg:p-8">
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
            color: #111827 !important;
          }
          body * {
            visibility: hidden;
          }
          .weekly-reports,
          .weekly-reports * {
            visibility: visible;
          }
          .weekly-reports {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            color: #111827 !important;
          }
          .no-print {
            display: none !important;
          }
          .report-panel,
          .metric-card {
            break-inside: avoid;
            box-shadow: none !important;
            border: 1px solid #d1d5db !important;
          }
          .attendance-bar {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="no-print">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <span aria-hidden="true">←</span>
          Back to Dashboard
        </Link>
      </div>

      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-indigo-600">
            <BarChart3 size={17} />
            SCHOOL ANALYTICS
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Weekly Reports
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
            A clear overview of attendance, academic performance, and school
            activity for your selected reporting period.
          </p>
          {data && (
            <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
              {data.schoolName}
            </p>
          )}
        </div>

        <div className="no-print flex flex-wrap gap-2">
          <button
            onClick={() => void loadReport()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams({
                schoolId: data!.schoolId,
                start,
                end,
              });
              window.open(
                "/api/school/weekly-reports/pdf?" + params.toString(),
                "_blank",
                "noopener,noreferrer",
              );
            }}
            disabled={!data || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            <ArrowDownToLine size={16} />
            Print / Save PDF
          </button>
        </div>
      </header>

      <section className="no-print report-panel rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <CalendarDays size={17} className="text-indigo-600" />
          Reporting period
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            Start date
            <input
              type="date"
              value={start}
              max={end}
              onChange={(event) => setStart(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </label>
          <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            End date
            <input
              type="date"
              value={end}
              min={start}
              onChange={(event) => setEnd(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
          </label>
          <button
            onClick={() => void loadReport()}
            disabled={loading || !start || !end || start > end}
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Generate report
          </button>
        </div>
        {data && (
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Showing {prettyDate(data.startDate)} – {prettyDate(data.endDate)}
          </p>
        )}
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            onClick={() => void loadReport()}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : data ? (
        <>
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                School at a glance
              </h2>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Selected period
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Active students"
                value={compactNumber(summary!.activeStudents)}
                detail="Current active enrolment"
                icon={<GraduationCap size={20} />}
                tone="indigo"
              />
              <MetricCard
                label="Attendance rate"
                value={`${summary!.attendanceRate}%`}
                detail={`${compactNumber(summary!.attendanceRecords)} attendance records`}
                icon={<CheckCircle2 size={20} />}
                tone="emerald"
              />
              <MetricCard
                label="Average score"
                value={
                  summary!.averageScore === null
                    ? "—"
                    : `${summary!.averageScore}%`
                }
                detail={`${compactNumber(summary!.resultsRecorded)} results recorded in period`}
                icon={<Activity size={20} />}
                tone="violet"
              />
              <MetricCard
                label="Pass rate"
                value={summary!.resultsRecorded ? `${summary!.passRate}%` : "—"}
                detail="Results scoring 50 or above"
                icon={<BarChart3 size={20} />}
                tone="amber"
              />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="report-panel rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:col-span-2 sm:p-6">
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Attendance activity
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Daily attendance records during this period
                  </p>
                </div>
                <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Users size={19} />
                </span>
              </div>

              {data.attendanceTrend.length ? (
                <div className="space-y-4">
                  {data.attendanceTrend.map((day) => (
                    <div
                      key={day.day}
                      className="grid grid-cols-[76px_minmax(0,1fr)_42px] items-center gap-3"
                    >
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {new Date(`${day.day}T12:00:00`).toLocaleDateString(
                          undefined,
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          },
                        )}
                      </span>
                      <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div
                          className="attendance-bar h-full rounded-full bg-indigo-500 transition-all"
                          style={{
                            width: `${Math.max(2, (day.total / maxAttendance) * 100)}%`,
                          }}
                          title={`${day.total} records`}
                        />
                      </div>
                      <span className="text-right text-xs font-bold tabular-nums text-gray-800 dark:text-gray-200">
                        {day.total}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No attendance records were found for these dates." />
              )}

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                <MiniStat label="Present" value={summary!.presentCount} />
                <MiniStat label="Absent" value={summary!.absentCount} />
                <MiniStat label="Late" value={summary!.lateCount} />
              </div>
            </div>

            <div className="report-panel rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Academic activity
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Key teaching and learning indicators
                  </p>
                </div>
                <span className="rounded-lg bg-violet-50 p-2 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <BookOpen size={19} />
                </span>
              </div>

              <div className="space-y-5">
                <ActivityRow
                  label="Results recorded"
                  value={summary!.resultsRecorded}
                />
                <ActivityRow
                  label="Assignments due"
                  value={summary!.assignmentsDue}
                />
                <ActivityRow
                  label="Report cards published"
                  value={summary!.reportsPublished}
                />
              </div>

              <div className="mt-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
                <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  Performance snapshot
                </div>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {summary!.resultsRecorded
                    ? `The average score for results recorded in this period is ${summary!.averageScore ?? 0}%, with ${summary!.passRate}% scoring at least 50.`
                    : "No results were recorded during this period. Try a wider date range to review earlier academic activity."}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              School operations
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SmallCard
                label="Staff members"
                value={summary!.staffCount}
                icon={<Users size={18} />}
              />
              <SmallCard
                label="Classes"
                value={summary!.classCount}
                icon={<BookOpen size={18} />}
              />
              <SmallCard
                label="Assignments due"
                value={summary!.assignmentsDue}
                icon={<Clock3 size={18} />}
              />
              <SmallCard
                label="Reports published"
                value={summary!.reportsPublished}
                icon={<CheckCircle2 size={18} />}
              />
            </div>
          </section>

          <footer className="border-t border-gray-200 pt-4 text-xs leading-5 text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <p>
              Generated from SchoolPilot records for{" "}
              {prettyDate(data.startDate)} to {prettyDate(data.endDate)}.
              Attendance rate counts present and late records against all
              attendance records.
            </p>
            <p className="mt-1">
              Academic averages and pass rate are based on results created
              during the selected period. Assignments due and report cards
              published are counted within the same period.
            </p>
          </footer>
        </>
      ) : null}
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: "indigo" | "emerald" | "violet" | "amber";
}) {
  const tones = {
    indigo:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    violet:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  };

  return (
    <div className="metric-card rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <span className={`rounded-xl p-2 ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{detail}</p>
    </div>
  );
}

function SmallCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="metric-card flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <span className="rounded-xl bg-gray-100 p-3 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
        {icon}
      </span>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
          {compactNumber(value)}
        </p>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
        {compactNumber(value)}
      </p>
    </div>
  );
}

function ActivityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800">
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
      <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
        {compactNumber(value)}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-4 text-center dark:border-gray-700">
      <CalendarDays size={23} className="mb-2 text-gray-400" />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
