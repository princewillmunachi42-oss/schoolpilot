import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentTeacher } from "@/lib/auth/teacher";

export default async function TeacherDashboardPage() {
  const teacher = await getCurrentTeacher();

  if (!teacher) {
    redirect("/login");
  }

  const schoolResult = await pool.query(
    `
      SELECT
        id,
        name,
        email
      FROM schools
      WHERE id = $1
      LIMIT 1
    `,
    [teacher.schoolId]
  );

  const school = schoolResult.rows[0];

  if (!school) {
    redirect("/login");
  }

  const [classesResult, subjectsResult, timetableResult] =
    await Promise.all([
      pool.query(
        `
          SELECT COUNT(DISTINCT class_id) AS count
          FROM class_teachers
          WHERE school_id = $1
            AND staff_id = $2
        `,
        [teacher.schoolId, teacher.staffId]
      ),

      pool.query(
        `
          SELECT COUNT(DISTINCT subject_id) AS count
          FROM teacher_subjects
          WHERE school_id = $1
            AND staff_id = $2
        `,
        [teacher.schoolId, teacher.staffId]
      ),

      pool.query(
        `
          SELECT COUNT(*) AS count
          FROM timetable_entries
          WHERE school_id = $1
            AND staff_id = $2
            AND is_active = true
        `,
        [teacher.schoolId, teacher.staffId]
      ),
    ]);

  const classesCount = Number(classesResult.rows[0]?.count ?? 0);
  const subjectsCount = Number(subjectsResult.rows[0]?.count ?? 0);
  const timetableCount = Number(timetableResult.rows[0]?.count ?? 0);

  const notificationsResult = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE school_id = $1
        AND user_id = $2
        AND is_read = false
    `,
    [teacher.schoolId, teacher.userId]
  );

  const unreadNotificationsCount = Number(
    notificationsResult.rows[0]?.count ?? 0
  );

  return (


          <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
            <div>
              <p className="text-sm font-medium text-primary">
                Teacher Portal
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {teacher.staff.first_name}
              </h1>

              <p className="mt-2 text-muted-foreground">
                Manage your assigned classes, subjects, timetable,
                attendance, and results.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <a
                href="/teacher/classes"
                className="rounded-2xl border bg-card p-6 transition-colors hover:bg-muted"
              >
                <p className="text-sm text-muted-foreground">
                  My Classes
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {classesCount}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Classes assigned to you
                </p>
              </a>

              <a
                href="/teacher/subjects"
                className="rounded-2xl border bg-card p-6 transition-colors hover:bg-muted"
              >
                <p className="text-sm text-muted-foreground">
                  My Subjects
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {subjectsCount}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Subjects you teach
                </p>
              </a>

              <a
                href="/teacher/timetable"
                className="rounded-2xl border bg-card p-6 transition-colors hover:bg-muted"
              >
                <p className="text-sm text-muted-foreground">
                  My Timetable
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {timetableCount}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Scheduled lessons
                </p>
              </a>
            </div>

            <div className="mt-8 rounded-2xl border bg-card p-6">
              <h2 className="text-lg font-semibold">
                Teacher access
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your portal is connected to your school account and
                teacher record. Future teacher features will only expose
                students, classes, subjects, attendance, and results
                assigned to you.
              </p>
            </div>
          </section>
  );
}
