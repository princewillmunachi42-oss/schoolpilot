import Link from "next/link";
import { redirect } from "next/navigation";
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
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/student"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            ← Back to Student Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">
            Timetable unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            You have not been assigned to a class yet.
          </p>
        </div>
      </section>
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

  return (
    <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <Link
          href="/student"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to Student Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Student Portal
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          My Timetable
        </h1>

        <p className="mt-2 text-muted-foreground">
          {studentClass
            ? `${studentClass.name}${
                studentClass.level
                  ? ` • ${studentClass.level}`
                  : ""
              }`
            : "Your class timetable"}
        </p>
      </div>

      {periods.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            No timetable periods
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your school has not configured timetable periods yet.
          </p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            No timetable available
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no timetable entries for your class.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border bg-card lg:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left text-sm font-semibold">
                    Period
                  </th>

                  {DAYS.map((day) => (
                    <th
                      key={day.value}
                      className="p-4 text-left text-sm font-semibold"
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
                      <p className="font-medium">
                        {period.name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {String(period.start_time).slice(0, 5)}
                        {" - "}
                        {String(period.end_time).slice(0, 5)}
                      </p>
                    </td>

                    {DAYS.map((day) => {
                      const entry = entryMap.get(
                        `${day.value}-${period.id}`
                      );

                      return (
                        <td
                          key={`${period.id}-${day.value}`}
                          className="p-4 align-top"
                        >
                          {period.is_break ? (
                            <span className="text-sm font-medium text-muted-foreground">
                              Break
                            </span>
                          ) : entry ? (
                            <div>
                              <p className="font-semibold">
                                {entry.subject_name}
                              </p>

                              {entry.subject_code && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {entry.subject_code}
                                </p>
                              )}

                              <p className="mt-2 text-xs text-muted-foreground">
                                {entry.teacher_name}
                              </p>

                              {entry.room && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Room: {entry.room}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 lg:hidden">
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
                  className="rounded-2xl border bg-card p-5"
                >
                  <h2 className="text-lg font-semibold">
                    {day.label}
                  </h2>

                  <div className="mt-4 space-y-3">
                    {dayEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No classes scheduled.
                      </p>
                    ) : (
                      dayEntries.map(({ period, entry }) => (
                        <div
                          key={period.id}
                          className="rounded-xl border p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">
                                {period.name}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {String(
                                  period.start_time
                                ).slice(0, 5)}
                                {" - "}
                                {String(
                                  period.end_time
                                ).slice(0, 5)}
                              </p>
                            </div>

                            {period.is_break && (
                              <span className="text-xs font-medium text-muted-foreground">
                                Break
                              </span>
                            )}
                          </div>

                          {entry && (
                            <div className="mt-3">
                              <p className="font-semibold">
                                {entry.subject_name}
                              </p>

                              {entry.subject_code && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {entry.subject_code}
                                </p>
                              )}

                              <p className="mt-2 text-xs text-muted-foreground">
                                {entry.teacher_name}
                              </p>

                              {entry.room && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Room: {entry.room}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
