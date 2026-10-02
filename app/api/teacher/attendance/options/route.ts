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

    const sessionResult = await pool.query(
      `SELECT
         id,
         name,
         start_date,
         end_date,
         is_current
       FROM academic_sessions
       WHERE school_id = $1
         AND is_current = TRUE
       ORDER BY start_date DESC
       LIMIT 1`,
      [teacher.schoolId]
    );

    const session = sessionResult.rows[0];

    if (!session) {
      return NextResponse.json(
        { error: "No current academic session is configured." },
        { status: 404 }
      );
    }

    const termResult = await pool.query(
      `SELECT
         id,
         name,
         start_date,
         end_date,
         is_current,
         academic_session_id
       FROM terms
       WHERE school_id = $1
         AND academic_session_id = $2
         AND is_current = TRUE
       ORDER BY start_date ASC
       LIMIT 1`,
      [teacher.schoolId, session.id]
    );

    const term = termResult.rows[0];

    if (!term) {
      return NextResponse.json(
        { error: "No current term is configured for this academic session." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session,
      term,
    });
  } catch (error) {
    console.error("Teacher attendance options error:", error);

    return NextResponse.json(
      { error: "Failed to load attendance options." },
      { status: 500 }
    );
  }
}
