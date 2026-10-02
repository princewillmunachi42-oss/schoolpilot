import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentTeacher } from "@/lib/auth/teacher";

export async function GET() {
  try {
    const teacher = await getCurrentTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [sessionResult, classesResult, subjectsResult] =
      await Promise.all([
        pool.query(
          `SELECT id, name
           FROM academic_sessions
           WHERE school_id = $1
             AND is_current = TRUE
           LIMIT 1`,
          [teacher.schoolId]
        ),

        pool.query(
          `SELECT DISTINCT
             c.id,
             c.name,
             c.level
           FROM classes c
           INNER JOIN class_teachers ct
             ON ct.class_id = c.id
            AND ct.school_id = c.school_id
            AND ct.staff_id = $1
           WHERE c.school_id = $2
             AND c.status = 'active'
           ORDER BY c.name ASC`,
          [teacher.staffId, teacher.schoolId]
        ),

        pool.query(
          `SELECT DISTINCT
             sub.id,
             sub.name,
             sub.code,
             ts.class_id
           FROM teacher_subjects ts
           INNER JOIN subjects sub
             ON sub.id = ts.subject_id
            AND sub.school_id = ts.school_id
           WHERE ts.school_id = $1
             AND ts.staff_id = $2
             AND sub.status = 'active'
           ORDER BY sub.name ASC`,
          [teacher.schoolId, teacher.staffId]
        ),
      ]);

    const session = sessionResult.rows[0];

    if (!session) {
      return NextResponse.json(
        { error: "Current academic session is not configured." },
        { status: 404 }
      );
    }

    const termResult = await pool.query(
      `SELECT id, name
       FROM terms
       WHERE school_id = $1
         AND academic_session_id = $2
         AND is_current = TRUE
       LIMIT 1`,
      [teacher.schoolId, session.id]
    );

    const term = termResult.rows[0];

    if (!term) {
      return NextResponse.json(
        { error: "Current term is not configured." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session,
      term,
      classes: classesResult.rows,
      subjects: subjectsResult.rows,
    });
  } catch (error) {
    console.error("Teacher results options error:", error);

    return NextResponse.json(
      { error: "Failed to load result options." },
      { status: 500 }
    );
  }
}
