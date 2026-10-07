import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth/teacher";
import pool from "@/lib/db";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const teacher = await getCurrentTeacher();

  if (!teacher) {
    redirect("/login");
  }

  const schoolResult = await pool.query(
    `
      SELECT id, name, email
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

  const notificationsResult = await pool.query(
    `
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE school_id = $1
        AND user_id = $2
        AND is_read = FALSE
    `,
    [teacher.schoolId, teacher.userId]
  );

  const unreadNotificationsCount = Number(
    notificationsResult.rows[0]?.count ?? 0
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
          <div className="border-b p-5">
            <Link href="/teacher" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-white">
                S
              </div>

              <div>
                <p className="font-bold tracking-tight">SchoolPilot</p>
                <p className="text-xs text-muted-foreground">
                  Teacher Portal
                </p>
              </div>
            </Link>
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
            <Link
              href="/teacher"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Dashboard
            </Link>

            <Link
              href="/teacher/classes"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              My Classes
            </Link>

            <Link
              href="/teacher/subjects"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              My Subjects
            </Link>

            <Link
              href="/teacher/timetable"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              My Timetable
            </Link>

            <Link
              href="/teacher/attendance"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Attendance
            </Link>

            <Link
              href="/teacher/results"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Results
            </Link>

            <Link
              href="/teacher/assignments"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Assignments
            </Link>

            <Link
              href="/teacher/announcements"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Announcements
            </Link>

            <Link
              href="/teacher/profile"
              className="block rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              My Profile
            </Link>
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
                  Teacher Portal
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/teacher/notifications"
                  aria-label="Notifications"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted"
                >
                  <span className="text-lg">🔔</span>

                  {unreadNotificationsCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unreadNotificationsCount > 99
                        ? "99+"
                        : unreadNotificationsCount}
                    </span>
                  )}
                </Link>

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
            </div>

            <div className="overflow-x-auto border-t lg:hidden">
              <nav className="flex min-w-max gap-1 p-2">
                <Link
                  href="/teacher"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Dashboard
                </Link>

                <Link
                  href="/teacher/classes"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Classes
                </Link>

                <Link
                  href="/teacher/subjects"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Subjects
                </Link>

                <Link
                  href="/teacher/timetable"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Timetable
                </Link>

                <Link
                  href="/teacher/attendance"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Attendance
                </Link>

                <Link
                  href="/teacher/results"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Results
                </Link>

                <Link
                  href="/teacher/assignments"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Assignments
                </Link>

                <Link
                  href="/teacher/announcements"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Announcements
                </Link>

                <Link
                  href="/teacher/profile"
                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Profile
                </Link>
              </nav>
            </div>
          </header>

          {children}
        </div>
      </div>
    </main>
  );
}
