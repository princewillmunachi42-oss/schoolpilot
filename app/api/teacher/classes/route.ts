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
         c.id,
         c.name,
         c.level,
         c.capacity,
         c.status,
         ct.is_primary,
         ct.created_at
       FROM class_teachers ct
       INNER JOIN classes c
         ON c.id = ct.class_id
        AND c.school_id = ct.school_id
       WHERE ct.school_id = $1
         AND ct.staff_id = $2
         AND c.status = 'active'
       ORDER BY c.name ASC`,
      [teacher.schoolId, teacher.staffId]
    );

    return NextResponse.json({
      classes: result.rows,
    });
  } catch (error) {
    console.error("Teacher classes GET error:", error);

    return NextResponse.json(
      { error: "Failed to load your classes." },
      { status: 500 }
    );
  }
}
