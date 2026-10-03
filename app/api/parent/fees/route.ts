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
        fees: [],
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

    const feesResult = await pool.query(
      `SELECT
         sf.id,
         sf.fee_name,
         sf.amount_due,
         sf.amount_paid,
         (sf.amount_due - sf.amount_paid) AS balance,
         sf.due_date,
         sf.status,
         sf.remarks,
         sf.academic_session_id,
         sf.term_id,
         ses.name AS session_name,
         t.name AS term_name
       FROM student_fees sf
       INNER JOIN academic_sessions ses
         ON ses.id = sf.academic_session_id
        AND ses.school_id = sf.school_id
       INNER JOIN terms t
         ON t.id = sf.term_id
        AND t.school_id = sf.school_id
       WHERE sf.school_id = $1
         AND sf.student_id = $2
         AND ($3 = '' OR sf.academic_session_id = NULLIF($3, '')::uuid)
         AND ($4 = '' OR sf.term_id = NULLIF($4, '')::uuid)
       ORDER BY
         sf.due_date ASC NULLS LAST,
         sf.created_at DESC`,
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
      fees: feesResult.rows,
    });
  } catch (error) {
    console.error("PARENT FEES API ERROR:", error);

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
