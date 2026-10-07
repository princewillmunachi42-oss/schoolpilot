import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

export default async function StudentTimetablePage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const { student, schoolId } = currentStudent;

  if (!student.class_id) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <BackLink />

          <EmptyState
            icon={CalendarDays}
            title="Timetable unavailable"
            description="You have not been assigned to a class yet."
          />
        </div>
      </main>
    );
  }

  const [classResult, periodsResult, entriesResult] =
    await Promise.all([
      pool.query(
        `
          SELECT
            id,
            name,
            level
          FROM classes
          WHERE id = $1
            AND school_id = $2
            AND status = 'active'
          LIMIT 1
        `,
        [student.class_id, schoolId]
      ),

      pool.query(
        `
          SELECT
            id,
            name,
            period_number,
            start_time,
            end_time,
            is_break
          FROM timetable_periods
          WHERE school_id = $1
            AND is_active = TRUE
          ORDER BY period_number ASC
        `,
        [schoolId]
      ),

      pool.query(
        `
          SELECT
            te.id,
            te.day_of_week,
            te.period_id,
            te.room,
            tp.name AS period_name,
            tp.period_number,
            tp.start_time,
            tp.end_time,
            tp.is_break,
            s.name AS subject_name,
            s.code AS subject_code,
            CONCAT(st.first_name, ' ', st.last_name) AS teacher_name
          FROM timetable_entries te
          INNER JOIN timetable_periods tp
            ON tp.id = te.period_id
           AND tp.school_id = te.school_id
          INNER JOIN subjects s
            ON s.id = te.subject_id
           AND s.school_id = te.school_id
          INNER JOIN staff st
            ON st.id = te.staff_id
           AND st.school_id = te.school_id
          WHERE te.school_id = $1
            AND te.class_id = $2
            AND te.is_active = TRUE
          ORDER BY te.day_of_week, tp.period_number
        `,
        [schoolId, student.class_id]
      ),
    ]);

  const studentClass = classResult.rows[0];
  const periods = periodsResult.rows;
  const entries = entriesResult.rows;

  const entryMap = new Map(
    entries.map((entry) => [
      `${entry.day_of_week}-${entry.period_id}`,
      entry,
    ])
  );

  const teachingPeriods = entries.filter(
    (entry) => !entry.is_break
  ).length;

  const classLabel = studentClass
    ? `${studentClass.name}${
        studentClass.level ? ` • ${studentClass.level}` : ""
      }`
    : "Your class timetable";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <BackLink />

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <CalendarDays className="h-3.5 w-3.5" />
            Student Portal
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Timetable
              </h1>

              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Your weekly class schedule and lesson information.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Current Class
                </p>
                <p className="text-sm font-bold">
                  {classLabel}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Summary */}
        {periods.length > 0 && entries.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              icon={CalendarDays}
              label="School Days"
              value={`${DAYS.length}`}
              description="Monday to Friday"
            />

            <SummaryCard
              icon={Clock3}
              label="Periods"
              value={`${periods.length}`}
              description="Configured timetable periods"
            />

            <SummaryCard
              icon={GraduationCap}
              label="Lessons"
              value={`${teachingPeriods}`}
              description="Scheduled class lessons"
            />
          </section>
        )}

        {periods.length === 0 ? (
          <EmptyState
            icon={Clock3}
            title="No timetable periods"
            description="Your school has not configured timetable periods yet."
          />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No timetable available"
            description="There are currently no timetable entries for your class."
          />
        ) : (
          <>
            {/* Desktop timetable */}
            <section className="hidden overflow-hidden rounded-3xl border bg-card shadow-sm lg:block">
              <div className="border-b px-6 py-5">
                <h2 className="font-bold">Weekly Schedule</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your complete class schedule for the school week.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="w-44 p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Period
                      </th>

                      {DAYS.map((day) => (
                        <th
                          key={day.value}
                          className="p-4 text-left text-sm font-bold"
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {periods.map((period) => (
                      <tr
                        key={period.id}
                        className="border-b last:border-0"
                      >
                        <td className="p-4 align-top">
                          <div className="rounded-2xl bg-muted/50 p-3">
                            <p className="text-sm font-semibold">
                              {period.name}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock3 className="h-3 w-3" />
                              {formatTime(period.start_time)}
                              {" – "}
                              {formatTime(period.end_time)}
                            </div>
                          </div>
                        </td>

                        {DAYS.map((day) => {
                          const entry = entryMap.get(
                            `${day.value}-${period.id}`
                          );

                          return (
                            <td
                              key={`${period.id}-${day.value}`}
                              className="p-3 align-top"
                            >
                              {period.is_break ? (
                                <div className="flex min-h-[105px] items-center justify-center rounded-2xl border border-dashed bg-muted/30 p-4 text-center">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    Break
                                  </span>
                                </div>
                              ) : entry ? (
                                <LessonCard entry={entry} />
                              ) : (
                                <div className="flex min-h-[105px] items-center justify-center rounded-2xl border border-dashed p-4">
                                  <span className="text-xs text-muted-foreground">
                                    No class
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Mobile timetable */}
            <section className="space-y-4 lg:hidden">
              {DAYS.map((day) => {
                const dayEntries = periods
                  .map((period) => ({
                    period,
                    entry: entryMap.get(
                      `${day.value}-${period.id}`
                    ),
                  }))
                  .filter(
                    ({ period, entry }) =>
                      period.is_break || entry
                  );

                return (
                  <div
                    key={day.value}
                    className="overflow-hidden rounded-3xl border bg-card shadow-sm"
                  >
                    <div className="border-b bg-muted/30 px-5 py-4">
                      <h2 className="font-bold">{day.label}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Daily schedule
                      </p>
                    </div>

                    <div className="space-y-3 p-4">
                      {dayEntries.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-5 text-center">
                          <p className="text-sm text-muted-foreground">
                            No classes scheduled.
                          </p>
                        </div>
                      ) : (
                        dayEntries.map(({ period, entry }) => (
                          <div
                            key={period.id}
                            className="rounded-2xl border p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold">
                                  {period.name}
                                </p>

                                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Clock3 className="h-3 w-3" />
                                  {formatTime(period.start_time)}
                                  {" – "}
                                  {formatTime(period.end_time)}
                                </div>
                              </div>

                              {period.is_break && (
                                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                                  Break
                                </span>
                              )}
                            </div>

                            {entry && (
                              <div className="mt-4 border-t pt-4">
                                <p className="font-bold">
                                  {entry.subject_name}
                                </p>

                                {entry.subject_code && (
                                  <p className="mt-1 text-xs font-medium text-primary">
                                    {entry.subject_code}
                                  </p>
                                )}

                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <UserRound className="h-3.5 w-3.5" />
                                    <span>{entry.teacher_name}</span>
                                  </div>

                                  {entry.room && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <MapPin className="h-3.5 w-3.5" />
                                      <span>
                                        Room: {entry.room}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/student"
      className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Student Dashboard
    </Link>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function LessonCard({
  entry,
}: {
  entry: {
    subject_name: string;
    subject_code: string | null;
    teacher_name: string;
    room: string | null;
  };
}) {
  return (
    <div className="min-h-[105px] rounded-2xl border bg-background p-4 transition hover:border-primary/30 hover:shadow-sm">
      <p className="font-semibold leading-5">
        {entry.subject_name}
      </p>

      {entry.subject_code && (
        <p className="mt-1 text-[11px] font-semibold text-primary">
          {entry.subject_code}
        </p>
      )}

      <div className="mt-3 space-y-1.5">
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <UserRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{entry.teacher_name}</span>
        </div>

        {entry.room && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{entry.room}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-3xl border bg-card p-10 text-center shadow-sm sm:p-14">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>

      <h2 className="mt-5 text-xl font-bold">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      <Link
        href="/student"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </section>
  );
}

function formatTime(value: string | Date) {
  return String(value).slice(0, 5);
}
