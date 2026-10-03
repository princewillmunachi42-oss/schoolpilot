import { NextRequest, NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth/parent";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent account not found.",
        },
        { status: 401 }
      );
    }

    const studentId =
      request.nextUrl.searchParams.get("student")?.trim() || "";

    const sessionId =
      request.nextUrl.searchParams.get("session")?.trim() || "";

    const termId =
      request.nextUrl.searchParams.get("term")?.trim() || "";

    const childrenResult = await pool.query(
      `SELECT
         s.id,
         s.first_name,
         s.last_name,
         s.other_name,
         s.admission_number,
         c.name AS class_name,
         ps.relationship
       FROM parent_students ps
       INNER JOIN students s
         ON s.id = ps.student_id
        AND s.school_id = ps.school_id
       LEFT JOIN classes c
         ON c.id = s.class_id
        AND c.school_id = s.school_id
       WHERE ps.parent_id = $1
         AND ps.school_id = $2
         AND s.status = 'active'
       ORDER BY s.first_name, s.last_name`,
      [parent.parentId, parent.schoolId]
    );

    const children = childrenResult.rows;

    if (children.length === 0) {
      return NextResponse.json({
        success: true,
        children: [],
        sessions: [],
        terms: [],
        results: [],
      });
    }

    const selectedChild = studentId
      ? children.find((child) => child.id === studentId)
      : children[0];

    if (studentId && !selectedChild) {
      return NextResponse.json(
        {
          success: false,
          message: "This student is not linked to your parent account.",
        },
        { status: 403 }
      );
    }

    const selectedStudentId = selectedChild.id;

    const sessionsResult = await pool.query(
      `SELECT
         id,
         name,
         start_date,
         end_date,
         is_current
       FROM academic_sessions
       WHERE school_id = $1
       ORDER BY start_date DESC, created_at DESC`,
      [parent.schoolId]
    );

    const termsResult = await pool.query(
      `SELECT
         id,
         name,
         academic_session_id,
         start_date,
         end_date,
         is_current
       FROM terms
       WHERE school_id = $1
         AND ($2 = '' OR academic_session_id = NULLIF($2, '')::uuid)
       ORDER BY start_date DESC, created_at DESC`,
      [parent.schoolId, sessionId]
    );

    const resultsResult = await pool.query(
      `SELECT
         r.id,
         r.ca_score,
         r.exam_score,
         r.total_score,
         r.grade,
         r.remarks,
         r.academic_session_id,
         r.term_id,
         ses.name AS session_name,
         t.name AS term_name,
         sub.name AS subject_name,
         sub.code AS subject_code
       FROM results r
       INNER JOIN academic_sessions ses
         ON ses.id = r.academic_session_id
        AND ses.school_id = r.school_id
       INNER JOIN terms t
         ON t.id = r.term_id
        AND t.school_id = r.school_id
       INNER JOIN subjects sub
         ON sub.id = r.subject_id
        AND sub.school_id = r.school_id
       WHERE r.school_id = $1
         AND r.student_id = $2
         AND ($3 = '' OR r.academic_session_id = NULLIF($3, '')::uuid)
         AND ($4 = '' OR r.term_id = NULLIF($4, '')::uuid)
       ORDER BY sub.name ASC`,
      [
        parent.schoolId,
        selectedStudentId,
        sessionId,
        termId,
      ]
    );

    return NextResponse.json({
      success: true,
      children,
      selectedStudentId,
      sessions: sessionsResult.rows,
      terms: termsResult.rows,
      results: resultsResult.rows,
    });
  } catch (error) {
    console.error("PARENT RESULTS API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}
