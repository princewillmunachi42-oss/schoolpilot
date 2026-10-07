import Link from "next/link";
import { redirect } from "next/navigation";
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

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/student"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to Student Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View your attendance records and attendance history.
          </p>
        </div>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Total Records
            </p>
            <p className="mt-2 text-3xl font-bold">{total}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Present
            </p>
            <p className="mt-2 text-3xl font-bold">{present}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Absent
            </p>
            <p className="mt-2 text-3xl font-bold">{absent}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Late / Excused
            </p>
            <p className="mt-2 text-3xl font-bold">
              {late + excused}
            </p>
          </div>
        </section>

        <AttendanceFilters attendance={attendance} />
      </div>
    </main>
  );
}
