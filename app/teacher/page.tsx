import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  ShieldCheck,
  Users,
} from "lucide-react";
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
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <LayoutDashboard className="h-4 w-4" />
            Teacher Portal
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {teacher.staff.first_name}
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Manage your assigned classes, subjects, timetable, attendance,
            assignments, and results from one workspace.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/teacher/classes"
          className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>

          <p className="mt-5 text-sm font-medium text-muted-foreground">
            Assigned Classes
          </p>

          <p className="mt-1 text-3xl font-bold tracking-tight">
            {classesCount}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            View the classes assigned to you.
          </p>
        </Link>

        <Link
          href="/teacher/subjects"
          className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <BookOpen className="h-6 w-6" />
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>

          <p className="mt-5 text-sm font-medium text-muted-foreground">
            Assigned Subjects
          </p>

          <p className="mt-1 text-3xl font-bold tracking-tight">
            {subjectsCount}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            View the subjects you teach.
          </p>
        </Link>

        <Link
          href="/teacher/timetable"
          className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarDays className="h-6 w-6" />
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </div>

          <p className="mt-5 text-sm font-medium text-muted-foreground">
            Timetable Entries
          </p>

          <p className="mt-1 text-3xl font-bold tracking-tight">
            {timetableCount}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Check your teaching schedule.
          </p>
        </Link>
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <p className="text-sm font-semibold text-primary">
            Teaching Workspace
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            Everything you need for your classes
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your day-to-day teaching tools quickly.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/teacher/attendance"
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold">Attendance</h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Record and manage attendance for your assigned students.
            </p>

            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
              Open
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/teacher/assignments"
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <GraduationCap className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold">Assignments</h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Manage assignments and learning tasks for your students.
            </p>

            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
              Open
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/teacher/results"
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold">Results</h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Enter and manage academic results for assigned students.
            </p>

            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
              Open
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            href="/teacher/announcements"
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Megaphone className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold">Announcements</h3>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              View important announcements from your school.
            </p>

            <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
              Open
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">Your teaching access</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your portal is connected to your school account and teacher
                record. You only have access to the students, classes,
                subjects, attendance, assignments, and results assigned to
                you.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">{school.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your teacher workspace is connected to your school. Use the
                tools above to manage your assigned teaching responsibilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
