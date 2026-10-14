import { NextRequest, NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth/parent";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = request.nextUrl.searchParams;
    const studentId = params.get("student") || "";
    const sessionId = params.get("session") || "";
    const termId = params.get("term") || "";

    // Only children explicitly linked to this authenticated parent qualify.
    const childrenResult = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.other_name,
              s.admission_number, c.name AS class_name,
              ps.relationship
       FROM parent_students ps
       JOIN students s
         ON s.id = ps.student_id
        AND s.school_id = ps.school_id
       LEFT JOIN classes c
         ON c.id = s.class_id
        AND c.school_id = s.school_id
       WHERE ps.parent_id = $1
         AND ps.school_id = $2
         AND s.status = 'active'
         AND ($3 = '' OR s.id::text = $3)
       ORDER BY s.first_name, s.last_name`,
      [parent.parentId, parent.schoolId, studentId]
    );

    const children = childrenResult.rows;
    const allowedStudentIds = children.map((child) => child.id);

    if (studentId && !allowedStudentIds.includes(studentId)) {
      return NextResponse.json(
        { success: false, message: "Child not found or access denied." },
        { status: 403 }
      );
    }

    if (children.length === 0) {
      return NextResponse.json({
        success: true,
        children: [],
        reports: [],
      });
    }

    const reportsResult = await pool.query(
      `SELECT
         rc.id,
         rc.student_id,
         rc.academic_session_id,
         rc.term_id,
         rc.teacher_comment,
         rc.principal_comment,
         rc.conduct_comment,
         rc.published_at,
         s.first_name,
         s.last_name,
         s.other_name,
         s.admission_number,
         c.name AS class_name,
         ses.name AS session_name,
         t.name AS term_name
       FROM student_report_cards rc
       JOIN students s
         ON s.id = rc.student_id
        AND s.school_id = rc.school_id
       JOIN academic_sessions ses
         ON ses.id = rc.academic_session_id
        AND ses.school_id = rc.school_id
       JOIN terms t
         ON t.id = rc.term_id
        AND t.school_id = rc.school_id
       LEFT JOIN classes c
         ON c.id = s.class_id
        AND c.school_id = s.school_id
       WHERE rc.school_id = $1
         AND rc.status = 'published'
         AND rc.published_at IS NOT NULL
         AND rc.student_id = ANY($2::uuid[])
         AND ($3 = '' OR rc.academic_session_id::text = $3)
         AND ($4 = '' OR rc.term_id::text = $4)
       ORDER BY rc.published_at DESC, ses.name DESC, t.name`,
      [parent.schoolId, allowedStudentIds, sessionId, termId]
    );

    const reports = [];

    for (const report of reportsResult.rows) {
      const [resultsResult, attendanceResult, summaryResult] =
        await Promise.all([
          pool.query(
            `SELECT
               r.id,
               r.ca_score,
               r.exam_score,
               r.total_score,
               r.grade,
               r.remarks,
               sub.name AS subject_name,
               sub.code AS subject_code
             FROM results r
             JOIN subjects sub
               ON sub.id = r.subject_id
              AND sub.school_id = r.school_id
             WHERE r.school_id = $1
               AND r.student_id = $2
               AND r.academic_session_id = $3
               AND r.term_id = $4
             ORDER BY sub.name`,
            [
              parent.schoolId,
              report.student_id,
              report.academic_session_id,
              report.term_id,
            ]
          ),
          pool.query(
            `SELECT
               COUNT(*)::int AS total_recorded,
               COUNT(*) FILTER (WHERE status = 'present')::int AS present,
               COUNT(*) FILTER (WHERE status = 'absent')::int AS absent,
               COUNT(*) FILTER (WHERE status = 'late')::int AS late,
               COUNT(*) FILTER (WHERE status = 'excused')::int AS excused
             FROM attendance_records
             WHERE school_id = $1
               AND student_id = $2
               AND academic_session_id = $3
               AND term_id = $4`,
            [
              parent.schoolId,
              report.student_id,
              report.academic_session_id,
              report.term_id,
            ]
          ),
          pool.query(
            `SELECT
               COUNT(*)::int AS subjects_recorded,
               ROUND(AVG(total_score)::numeric, 2) AS average_score,
               ROUND(SUM(total_score)::numeric, 2) AS total_score
             FROM results
             WHERE school_id = $1
               AND student_id = $2
               AND academic_session_id = $3
               AND term_id = $4`,
            [
              parent.schoolId,
              report.student_id,
              report.academic_session_id,
              report.term_id,
            ]
          ),
        ]);

      const attendance = attendanceResult.rows[0];
      const recorded = Number(attendance.total_recorded);

      reports.push({
        ...report,
        results: resultsResult.rows,
        summary: summaryResult.rows[0],
        attendance: {
          ...attendance,
          rate:
            recorded > 0
              ? Number(
                  (
                    (Number(attendance.present) / recorded) *
                    100
                  ).toFixed(2)
                )
              : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      children,
      reports,
    });
  } catch (error) {
    console.error("Parent report cards GET error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load published report cards." },
      { status: 500 }
    );
  }
}
