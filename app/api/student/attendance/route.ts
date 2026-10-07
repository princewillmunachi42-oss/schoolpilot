import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";

export async function GET() {
  try {
    const currentStudent = await getCurrentStudent();

    if (!currentStudent) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          ar.id,
          ar.attendance_date,
          ar.status,
          ar.remarks,
          ar.academic_session_id,
          ar.term_id,
          a.name AS session_name,
          t.name AS term_name
        FROM attendance_records ar
        INNER JOIN academic_sessions a
          ON a.id = ar.academic_session_id
         AND a.school_id = ar.school_id
        INNER JOIN terms t
          ON t.id = ar.term_id
         AND t.school_id = ar.school_id
        WHERE ar.school_id = $1
          AND ar.student_id = $2
        ORDER BY ar.attendance_date DESC, ar.created_at DESC
      `,
      [currentStudent.schoolId, currentStudent.studentId]
    );

    return NextResponse.json({
      success: true,
      attendance: result.rows,
    });
  } catch (error) {
    console.error("Student attendance GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load attendance.",
      },
      { status: 500 }
    );
  }
}

