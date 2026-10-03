import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentParent } from "@/lib/auth/parent";

export async function GET(request: NextRequest) {
  try {
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const studentId = searchParams.get("student") || "";
    const sessionId = searchParams.get("session") || "";
    const termId = searchParams.get("term") || "";

    // Get only children linked to this parent and school.
    const childrenResult = await pool.query(
      `SELECT
         s.id,
         s.first_name,
         s.last_name,
         s.other_name,
         s.admission_number,
         s.class_id,
         c.name AS class_name
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

    const selectedStudentId =
      studentId || children[0]?.id || "";

    if (
      selectedStudentId &&
      !children.some(
        (child) => child.id === selectedStudentId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to view this student's timetable.",
        },
        { status: 403 }
      );
    }

    // Get academic sessions for this school.
    const sessionsResult = await pool.query(
      `SELECT
     id,
  name,
  is_current
FROM academic_sessions
       WHERE school_id = $1
       ORDER BY
         is_current DESC,
         start_date DESC NULLS LAST,
         name DESC`,
      [parent.schoolId]
    );

    // Get terms for this school.
    const termsResult = await pool.query(
      `SELECT
  id,
  name,
  academic_session_id,
  is_current
FROM terms
       WHERE school_id = $1
       ORDER BY
         is_current DESC,
         start_date DESC NULLS LAST,
         name ASC`,
      [parent.schoolId]
    );

    // Use the explicitly selected session/term when provided.
    // Otherwise use the current session/current term.
    const selectedSessionId =
      sessionId ||
      sessionsResult.rows.find(
        (session) => session.is_current
      )?.id ||
      "";

    const selectedTermId =
      termId ||
      termsResult.rows.find(
        (term) =>
          term.is_current &&
          (!selectedSessionId ||
            term.academic_session_id === selectedSessionId)
      )?.id ||
      "";

    let timetable: any[] = [];

    if (selectedStudentId) {
      const timetableResult = await pool.query(
        `SELECT
           te.id,
           te.day_of_week,
           te.room,
           te.is_active,

           te.academic_session_id,
           te.term_id,
           te.period_id,
           te.class_id,
           te.subject_id,

           a.name AS session_name,
           t.name AS term_name,

           tp.name AS period_name,
           tp.period_number,
           tp.start_time,
           tp.end_time,
           tp.is_break,

           c.name AS class_name,

           s.name AS subject_name,
           s.code AS subject_code

         FROM timetable_entries te

         INNER JOIN students st
           ON st.id = $1
          AND st.school_id = te.school_id
          AND st.class_id = te.class_id
          AND st.status = 'active'

         INNER JOIN academic_sessions a
           ON a.id = te.academic_session_id
          AND a.school_id = te.school_id

         INNER JOIN terms t
           ON t.id = te.term_id
          AND t.school_id = te.school_id

         INNER JOIN timetable_periods tp
           ON tp.id = te.period_id
          AND tp.school_id = te.school_id
          AND tp.is_active = TRUE

         INNER JOIN classes c
           ON c.id = te.class_id
          AND c.school_id = te.school_id

         INNER JOIN subjects s
           ON s.id = te.subject_id
          AND s.school_id = te.school_id
          AND s.status = 'active'

         WHERE te.school_id = $2
           AND te.is_active = TRUE
           AND te.academic_session_id = $3
           AND te.term_id = $4

         ORDER BY
           te.day_of_week ASC,
           tp.period_number ASC`,
        [
          selectedStudentId,
          parent.schoolId,
          selectedSessionId,
          selectedTermId,
        ]
      );

      timetable = timetableResult.rows;
    }

    return NextResponse.json({
      children,
      selectedStudentId,
      selectedSessionId,
      selectedTermId,
      sessions: sessionsResult.rows,
      terms: termsResult.rows,
      timetable,
    });
  } catch (error) {
    console.error("Parent timetable GET error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load your child's timetable.",
      },
      { status: 500 }
    );
  }
}
