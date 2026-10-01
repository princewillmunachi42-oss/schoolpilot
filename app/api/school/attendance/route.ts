import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

async function getOwnerSchool(userId: string) {
  const result = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
       AND role = 'owner'
     LIMIT 1`,
    [userId]
  );

  return result.rows[0]?.school_id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = await getOwnerSchool(user.id);

    if (!schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentId = request.nextUrl.searchParams.get("student_id");

    if (!studentId) {
      return NextResponse.json(
        { error: "student_id is required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT
         ar.id,
         ar.student_id,
         ar.attendance_date,
         ar.status,
         ar.remarks,
         ar.academic_session_id,
         ar.term_id,
         s.name AS session_name,
         t.name AS term_name
       FROM attendance_records ar
       INNER JOIN academic_sessions s
         ON s.id = ar.academic_session_id
        AND s.school_id = ar.school_id
       INNER JOIN terms t
         ON t.id = ar.term_id
        AND t.school_id = ar.school_id
       WHERE ar.school_id = $1
         AND ar.student_id = $2
       ORDER BY ar.attendance_date DESC`,
      [schoolId, studentId]
    );

    return NextResponse.json({
      attendance: result.rows,
    });
  } catch (error) {
    console.error("Attendance GET error:", error);

    return NextResponse.json(
      { error: "Failed to load attendance records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = await getOwnerSchool(user.id);

    if (!schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const {
      student_id,
      academic_session_id,
      term_id,
      attendance_date,
      status,
      remarks,
    } = body;

    if (
      !student_id ||
      !academic_session_id ||
      !term_id ||
      !attendance_date ||
      !status
    ) {
      return NextResponse.json(
        { error: "Missing required attendance fields" },
        { status: 400 }
      );
    }

    if (!["present", "absent", "late", "excused"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid attendance status" },
        { status: 400 }
      );
    }

    const studentCheck = await pool.query(
      `SELECT id
       FROM students
       WHERE id = $1
         AND school_id = $2
       LIMIT 1`,
      [student_id, schoolId]
    );

    if (!studentCheck.rows[0]) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `INSERT INTO attendance_records (
         school_id,
         student_id,
         academic_session_id,
         term_id,
         attendance_date,
         status,
         remarks
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id,
         student_id,
         attendance_date,
         status,
         remarks,
         academic_session_id,
         term_id`,
      [
        schoolId,
        student_id,
        academic_session_id,
        term_id,
        attendance_date,
        status,
        remarks || null,
      ]
    );

    return NextResponse.json(
      { attendance: result.rows[0] },
      { status: 201 }
    );
  } catch (error: unknown) {
    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        { error: "Attendance has already been recorded for this student on this date" },
        { status: 409 }
      );
    }

    console.error("Attendance POST error:", error);

    return NextResponse.json(
      { error: "Failed to create attendance record" },
      { status: 500 }
    );
  }
}
