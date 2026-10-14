import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validDate(value: string | null): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestedSchoolId = request.nextUrl.searchParams.get("schoolId");
    const membershipResult = await pool.query(
      `SELECT sm.school_id, sm.role, s.name AS school_name
       FROM school_members sm
       JOIN schools s ON s.id = sm.school_id
       WHERE sm.user_id = $1
         AND ($2::text IS NULL OR sm.school_id::text = $2::text)
         AND sm.role IN ('owner', 'principal', 'admin')
       ORDER BY CASE sm.role
         WHEN 'owner' THEN 1
         WHEN 'principal' THEN 2
         ELSE 3
       END, s.name
       LIMIT 1`,
      [user.id, requestedSchoolId],
    );

    const membership = membershipResult.rows[0];

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have permission to view weekly reports." },
        { status: 403 },
      );
    }

    const params = request.nextUrl.searchParams;
    const endDate = params.get("end") ?? new Date().toISOString().slice(0, 10);
    const startDate =
      params.get("start") ??
      (() => {
        const date = new Date(`${endDate}T00:00:00.000Z`);
        date.setUTCDate(date.getUTCDate() - 6);
        return date.toISOString().slice(0, 10);
      })();

    if (!validDate(startDate) || !validDate(endDate) || startDate > endDate) {
      return NextResponse.json(
        { error: "Choose a valid date range." },
        { status: 400 },
      );
    }

    const schoolId = membership.school_id;

    const summaryResult = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int
          FROM students
          WHERE school_id = $1 AND status = 'active') AS active_students,

         (SELECT COUNT(*)::int
          FROM staff
          WHERE school_id = $1) AS staff_count,

         (SELECT COUNT(*)::int
          FROM classes
          WHERE school_id = $1) AS class_count,

         (SELECT COUNT(*)::int
          FROM attendance_records
          WHERE school_id = $1
            AND attendance_date >= $2::date
            AND attendance_date <= $3::date) AS attendance_records,

         (SELECT COUNT(*)::int
          FROM attendance_records
          WHERE school_id = $1
            AND attendance_date >= $2::date
            AND attendance_date <= $3::date
            AND LOWER(status) = 'present') AS present_count,

         (SELECT COUNT(*)::int
          FROM attendance_records
          WHERE school_id = $1
            AND attendance_date >= $2::date
            AND attendance_date <= $3::date
            AND LOWER(status) = 'absent') AS absent_count,

         (SELECT COUNT(*)::int
          FROM attendance_records
          WHERE school_id = $1
            AND attendance_date >= $2::date
            AND attendance_date <= $3::date
            AND LOWER(status) = 'late') AS late_count,

         (SELECT COUNT(*)::int
          FROM results
          WHERE school_id = $1
            AND created_at >= $2::date
            AND created_at < ($3::date + INTERVAL '1 day')) AS results_recorded,

         (SELECT ROUND(AVG(total_score)::numeric, 1)
          FROM results
          WHERE school_id = $1
            AND created_at >= $2::date
            AND created_at < ($3::date + INTERVAL '1 day')) AS average_score,

         (SELECT COUNT(*)::int
          FROM results
          WHERE school_id = $1
            AND created_at >= $2::date
            AND created_at < ($3::date + INTERVAL '1 day')
            AND total_score >= 50) AS passing_results,

         (SELECT COUNT(*)::int
          FROM assignments
          WHERE school_id = $1
            AND status = 'published'
            AND due_date >= $2::date
            AND due_date <= $3::date) AS assignments_due,

         (SELECT COUNT(*)::int
          FROM student_report_cards
          WHERE school_id = $1
            AND status = 'published'
            AND published_at >= $2::date
            AND published_at < ($3::date + INTERVAL '1 day')) AS reports_published`,
      [schoolId, startDate, endDate],
    );

    const trendResult = await pool.query(
      `SELECT
         attendance_date::text AS day,
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE LOWER(status) = 'present')::int AS present,
         COUNT(*) FILTER (WHERE LOWER(status) = 'absent')::int AS absent,
         COUNT(*) FILTER (WHERE LOWER(status) = 'late')::int AS late
       FROM attendance_records
       WHERE school_id = $1
         AND attendance_date >= $2::date
         AND attendance_date <= $3::date
       GROUP BY attendance_date
       ORDER BY attendance_date`,
      [schoolId, startDate, endDate],
    );

    const summary = summaryResult.rows[0];
    const attendanceRecords = Number(summary.attendance_records || 0);
    const presentCount = Number(summary.present_count || 0);
    const lateCount = Number(summary.late_count || 0);
    const resultsRecorded = Number(summary.results_recorded || 0);
    const passingResults = Number(summary.passing_results || 0);

    return NextResponse.json({
      schoolId: membership.school_id,
      schoolName: membership.school_name,
      startDate,
      endDate,
      summary: {
        activeStudents: Number(summary.active_students || 0),
        staffCount: Number(summary.staff_count || 0),
        classCount: Number(summary.class_count || 0),
        attendanceRecords,
        presentCount,
        absentCount: Number(summary.absent_count || 0),
        lateCount,
        attendanceRate: attendanceRecords
          ? Math.round(((presentCount + lateCount) / attendanceRecords) * 100)
          : 0,
        resultsRecorded,
        averageScore:
          summary.average_score === null ? null : Number(summary.average_score),
        passRate: resultsRecorded
          ? Math.round((passingResults / resultsRecorded) * 100)
          : 0,
        assignmentsDue: Number(summary.assignments_due || 0),
        reportsPublished: Number(summary.reports_published || 0),
      },
      attendanceTrend: trendResult.rows.map((row) => ({
        day: row.day,
        total: Number(row.total),
        present: Number(row.present),
        absent: Number(row.absent),
        late: Number(row.late),
      })),
    });
  } catch (error) {
    console.error(
      "Weekly reports GET error:",
      error instanceof Error ? error.stack : error,
    );
    return NextResponse.json(
      {
        error: "Unable to load the weekly report.",
        ...(process.env.NODE_ENV === "development"
          ? { details: error instanceof Error ? error.message : String(error) }
          : {}),
      },
      { status: 500 },
    );
  }
}
