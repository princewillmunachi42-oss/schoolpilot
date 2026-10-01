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
         r.id,
         r.student_id,
         r.ca_score,
         r.exam_score,
         r.total_score,
         r.grade,
         r.remarks,
         r.academic_session_id,
         r.term_id,
         r.subject_id,
         s.name AS session_name,
         t.name AS term_name,
         sub.name AS subject_name,
         sub.code AS subject_code
       FROM results r
       INNER JOIN academic_sessions s
         ON s.id = r.academic_session_id
        AND s.school_id = r.school_id
       INNER JOIN terms t
         ON t.id = r.term_id
        AND t.school_id = r.school_id
       INNER JOIN subjects sub
         ON sub.id = r.subject_id
        AND sub.school_id = r.school_id
       WHERE r.school_id = $1
         AND r.student_id = $2
       ORDER BY s.start_date DESC, t.name ASC, sub.name ASC`,
      [schoolId, studentId]
    );

    return NextResponse.json({
      results: result.rows,
    });
  } catch (error) {
    console.error("Results GET error:", error);

    return NextResponse.json(
      { error: "Failed to load results" },
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
      subject_id,
      ca_score,
      exam_score,
      grade,
      remarks,
    } = body;

    if (
      !student_id ||
      !academic_session_id ||
      !term_id ||
      !subject_id ||
      ca_score === undefined ||
      exam_score === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required result fields" },
        { status: 400 }
      );
    }

    const ca = Number(ca_score);
    const exam = Number(exam_score);

    if (
      !Number.isFinite(ca) ||
      !Number.isFinite(exam) ||
      ca < 0 ||
      ca > 40 ||
      exam < 0 ||
      exam > 60
    ) {
      return NextResponse.json(
        { error: "CA score must be 0-40 and exam score must be 0-60" },
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

    const subjectCheck = await pool.query(
      `SELECT id
       FROM subjects
       WHERE id = $1
         AND school_id = $2
         AND status = 'active'
       LIMIT 1`,
      [subject_id, schoolId]
    );

    if (!subjectCheck.rows[0]) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `INSERT INTO results (
         school_id,
         student_id,
         academic_session_id,
         term_id,
         subject_id,
         ca_score,
         exam_score,
         grade,
         remarks
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING
         id,
         student_id,
         ca_score,
         exam_score,
         total_score,
         grade,
         remarks,
         academic_session_id,
         term_id,
         subject_id`,
      [
        schoolId,
        student_id,
        academic_session_id,
        term_id,
        subject_id,
        ca,
        exam,
        grade || null,
        remarks || null,
      ]
    );

    return NextResponse.json(
      { result: result.rows[0] },
      { status: 201 }
    );
  } catch (error: unknown) {
    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          error:
            "A result already exists for this student, subject, session and term",
        },
        { status: 409 }
      );
    }

    console.error("Results POST error:", error);

    return NextResponse.json(
      { error: "Failed to create result" },
      { status: 500 }
    );
  }
}
