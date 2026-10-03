import { NextRequest, NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth/parent";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("ATTENDANCE STEP 1: request received");

    const parent = await getCurrentParent();

    console.log(
      "ATTENDANCE STEP 2: parent loaded",
      parent
        ? `school=${parent.schoolId}, parent=${parent.parentId}`
        : "NO PARENT"
    );

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

    console.log("ATTENDANCE STEP 3: parameters loaded");

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

    console.log(
      "ATTENDANCE STEP 4: children query completed",
      childrenResult.rows.length
    );

    const children = childrenResult.rows;

    if (children.length === 0) {
      console.log("ATTENDANCE STEP 5: no children");

      return NextResponse.json({
        success: true,
        children: [],
        sessions: [],
        terms: [],
        records: [],
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

    console.log(
      "ATTENDANCE STEP 5: selected student",
      selectedStudentId
    );

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

    console.log(
      "ATTENDANCE STEP 6: sessions query completed",
      sessionsResult.rows.length
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

    console.log(
      "ATTENDANCE STEP 7: terms query completed",
      termsResult.rows.length
    );

    const recordsResult = await pool.query(
      `SELECT
         ar.id,
         ar.attendance_date,
         ar.status,
         ar.remarks,
         ar.academic_session_id,
         ar.term_id,
         ses.name AS session_name,
         t.name AS term_name
       FROM attendance_records ar
       INNER JOIN academic_sessions ses
         ON ses.id = ar.academic_session_id
        AND ses.school_id = ar.school_id
       INNER JOIN terms t
         ON t.id = ar.term_id
        AND t.school_id = ar.school_id
       WHERE ar.school_id = $1
         AND ar.student_id = $2
         AND ($3 = '' OR ar.academic_session_id = NULLIF($3, '')::uuid)
         AND ($4 = '' OR ar.term_id = NULLIF($4, '')::uuid)
       ORDER BY ar.attendance_date DESC`,
      [
        parent.schoolId,
        selectedStudentId,
        sessionId,
        termId,
      ]
    );

    console.log(
      "ATTENDANCE STEP 8: records query completed",
      recordsResult.rows.length
    );

    console.log("ATTENDANCE STEP 9: sending response");

    return NextResponse.json({
      success: true,
      children,
      selectedStudentId,
      sessions: sessionsResult.rows,
      terms: termsResult.rows,
      records: recordsResult.rows,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : String(error);

    console.log(
      "ATTENDANCE STEP ERROR:",
      errorMessage
    );

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
