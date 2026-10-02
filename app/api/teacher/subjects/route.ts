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

    const result = await pool.query(
      `SELECT
         ts.id,
         ts.subject_id,
         s.name AS subject_name,
         s.code AS subject_code,
         ts.class_id,
         c.name AS class_name,
         c.level AS class_level
       FROM teacher_subjects ts
       INNER JOIN subjects s
         ON s.id = ts.subject_id
        AND s.school_id = ts.school_id
        AND s.status = 'active'
       LEFT JOIN classes c
         ON c.id = ts.class_id
        AND c.school_id = ts.school_id
       WHERE ts.school_id = $1
         AND ts.staff_id = $2
         AND (c.id IS NULL OR c.status = 'active')
       ORDER BY s.name ASC, c.name ASC NULLS FIRST`,
      [teacher.schoolId, teacher.staffId]
    );

    return NextResponse.json({
      subjects: result.rows,
    });
  } catch (error) {
    console.error("Teacher subjects GET error:", error);

    return NextResponse.json(
      { error: "Failed to load your subjects." },
      { status: 500 }
    );
  }
}
