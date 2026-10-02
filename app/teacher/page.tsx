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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
          <div className="border-b p-5">
            <a href="/teacher" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-white">
                S
              </div>

              <div>
                <p className="font-bold tracking-tight">SchoolPilot</p>
                <p className="text-xs text-muted-foreground">
                  Teacher Portal
                </p>
              </div>
            </a>
          </div>

          <div className="border-b p-4">
            <p className="truncate text-sm font-semibold">
              {school.name}
            </p>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {teacher.staff.email ?? teacher.user.email}
            </p>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            <a
              href="/teacher"
              className="block rounded-xl bg-primary px-4 py-3 text-sm font-medium text-white"
            >
              Dashboard
            </a>

            <a
              href="/teacher/classes"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              My Classes
            </a>

            <a
              href="/teacher/subjects"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              My Subjects
            </a>

            <a
              href="/teacher/timetable"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              My Timetable
            </a>

            <a
              href="/teacher/attendance"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Attendance
            </a>

            <a
              href="/teacher/results"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Results
            </a>

            <a
              href="/teacher/assignments"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Assignments
            </a>

            <a
              href="/teacher/announcements"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Announcements
            </a>

            <a
              href="/teacher/profile"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              My Profile
            </a>
          </nav>

          <div className="border-t p-4">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-muted"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-5 sm:px-8">
              <div>
                <p className="text-sm font-semibold lg:hidden">
                  SchoolPilot
                </p>

                <p className="hidden text-sm font-medium text-muted-foreground lg:block">
                  Teacher Dashboard
                </p>
              </div>

              <details className="relative">
  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-1 hover:bg-muted">
    <div className="hidden text-right sm:block">
      <p className="text-sm font-semibold">
        {teacher.staff.first_name} {teacher.staff.last_name}
      </p>

      <p className="text-xs capitalize text-muted-foreground">
        Teacher
      </p>
    </div>

    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
      {teacher.staff.first_name.charAt(0)}
      {teacher.staff.last_name.charAt(0)}
    </div>
  </summary>

  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border bg-card p-2 shadow-lg">
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted"
      >
        Logout
      </button>
    </form>
  </div>
</details>

</div>
            <div className="overflow-x-auto border-t lg:hidden">
              <nav className="flex min-w-max gap-1 p-2">
                <a
                  href="/teacher"
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"
                >
                  Dashboard
                </a>

                <a
                  href="/teacher/classes"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Classes
                </a>

                <a
                  href="/teacher/subjects"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Subjects
                </a>

                <a
                  href="/teacher/timetable"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Timetable
                </a>

                <a
                  href="/teacher/attendance"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Attendance
                </a>

                <a
                  href="/teacher/results"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Results
                </a>
                              <a
                  href="/teacher/assignments"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Assignments
                </a>

                <a
                  href="/teacher/announcements"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Announcements
                </a>
                <a
                  href="/teacher/profile"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Profile
                </a>
              </nav>
            </div>
          </header>

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
        </div>
      </div>
    </main>
  );
}
