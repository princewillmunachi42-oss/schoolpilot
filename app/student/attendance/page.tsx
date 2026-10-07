import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  GraduationCap,
} from "lucide-react";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";
import AttendanceFilters from "./AttendanceFilters";

type AttendanceRecord = {
  id: string;
  attendance_date: string;
  status: "present" | "absent" | "late" | "excused";
  remarks: string | null;
  session_name: string;
  term_name: string;
};

export default async function StudentAttendancePage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const result = await pool.query(
    `
      SELECT
        ar.id,
        ar.attendance_date,
        ar.status,
        ar.remarks,
        a.name AS session_name,
        t.name AS term_name
      FROM attendance_records ar
      INNER JOIN academic_sessions a
        ON a.id = ar.academic_session_id
       AND a.school_id = ar.school_id
      INNER JOIN terms t
        ON t.id = ar.term_id
       AND t.school_id = ar.school_id
      WHERE ar.school_id = $1
        AND ar.student_id = $2
      ORDER BY
        ar.attendance_date DESC,
        ar.created_at DESC
    `,
    [currentStudent.schoolId, currentStudent.studentId]
  );

  const attendance = result.rows as AttendanceRecord[];

  const total = attendance.length;
  const present = attendance.filter(
    (item) => item.status === "present"
  ).length;
  const absent = attendance.filter(
    (item) => item.status === "absent"
  ).length;
  const late = attendance.filter(
    (item) => item.status === "late"
  ).length;
  const excused = attendance.filter(
    (item) => item.status === "excused"
  ).length;

  const attendanceRate =
    total > 0 ? (present / total) * 100 : 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/student"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Student Dashboard
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Student Portal
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Attendance
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                View your attendance history and track your school attendance
                record.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <CalendarCheck2 className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Attendance Rate
                </p>
                <p className="text-sm font-bold">
                  {attendanceRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Summary */}
        <section className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={CalendarCheck2}
            label="Total Records"
            value={String(total)}
            description="Attendance entries"
          />

          <StatCard
            icon={CheckCircle2}
            label="Present"
            value={String(present)}
            description="Days marked present"
          />

          <StatCard
            icon={AlertCircle}
            label="Absent"
            value={String(absent)}
            description="Days marked absent"
          />

          <StatCard
            icon={Clock3}
            label="Late / Excused"
            value={String(late + excused)}
            description={`${late} late • ${excused} excused`}
          />
        </section>

        {/* Records */}
        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Attendance History
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Filter your records by session, term, or attendance status.
              </p>
            </div>
          </div>

          <AttendanceFilters attendance={attendance} />
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof CalendarCheck2;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="group rounded-3xl border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
