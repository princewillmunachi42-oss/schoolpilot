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
      `SELECT DISTINCT
         ts.class_id,
         c.name AS class_name,
         ts.subject_id,
         s.name AS subject_name,
         s.code AS subject_code
       FROM teacher_subjects ts
       INNER JOIN subjects s
         ON s.id = ts.subject_id
        AND s.school_id = ts.school_id
        AND s.status = 'active'
       INNER JOIN classes c
         ON c.id = ts.class_id
        AND c.school_id = ts.school_id
        AND c.status = 'active'
       WHERE ts.school_id = $1
         AND ts.staff_id = $2
         AND ts.class_id IS NOT NULL

       UNION

       SELECT DISTINCT
         ct.class_id,
         c.name AS class_name,
         ts.subject_id,
         s.name AS subject_name,
         s.code AS subject_code
       FROM teacher_subjects ts
       INNER JOIN class_teachers ct
         ON ct.school_id = ts.school_id
        AND ct.staff_id = ts.staff_id
       INNER JOIN classes c
         ON c.id = ct.class_id
        AND c.school_id = ct.school_id
        AND c.status = 'active'
       INNER JOIN subjects s
         ON s.id = ts.subject_id
        AND s.school_id = ts.school_id
        AND s.status = 'active'
       WHERE ts.school_id = $1
         AND ts.staff_id = $2
         AND ts.class_id IS NULL

       ORDER BY class_name ASC, subject_name ASC`,
      [teacher.schoolId, teacher.staffId]
    );

    return NextResponse.json({
      options: result.rows,
    });
  } catch (error) {
    console.error("Teacher assignment options GET error:", error);

    return NextResponse.json(
      { error: "Failed to load teaching assignments." },
      { status: 500 }
    );
  }
}
