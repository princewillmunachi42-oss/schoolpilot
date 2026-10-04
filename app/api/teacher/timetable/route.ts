import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentTeacher } from "@/lib/auth/teacher";

export async function GET() {
  try {
    const teacher = await getCurrentTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const result = await pool.query(
      `SELECT
         te.id,
         te.day_of_week,
         te.room,
         te.is_active,

         te.period_id,
         te.class_id,
         te.subject_id,

         tp.name AS period_name,
         tp.period_number,
         tp.start_time,
         tp.end_time,
         tp.is_break,

         c.name AS class_name,

         s.name AS subject_name,
         s.code AS subject_code

       FROM timetable_entries te

       INNER JOIN timetable_periods tp
         ON tp.id = te.period_id
        AND tp.school_id = te.school_id

       INNER JOIN classes c
         ON c.id = te.class_id
        AND c.school_id = te.school_id

       INNER JOIN subjects s
         ON s.id = te.subject_id
        AND s.school_id = te.school_id

       WHERE te.school_id = $1
         AND te.staff_id = $2
         AND te.is_active = TRUE

       ORDER BY
         te.day_of_week ASC,
         tp.period_number ASC`,
      [teacher.schoolId, teacher.staffId],
    );

    return NextResponse.json({
      timetable: result.rows,
    });
  } catch (error) {
    console.error("Teacher timetable GET error:", error);

    return NextResponse.json(
      { error: "Failed to load your timetable." },
      { status: 500 },
    );
  }
}


