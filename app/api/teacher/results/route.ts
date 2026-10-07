import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentTeacher } from "@/lib/auth/teacher";
import { notifyParentsAboutStudentEvent } from "@/lib/notifications/parents";
import { notifyStudentAboutResult } from "@/lib/notifications/results";

const VALID_GRADES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

async function teacherCanAccessStudent(
  schoolId: string,
  staffId: string,
  studentId: string
) {
  const result = await pool.query(
    `SELECT 1
     FROM students s
     INNER JOIN class_teachers ct
       ON ct.class_id = s.class_id
      AND ct.school_id = s.school_id
      AND ct.staff_id = $2
     WHERE s.id = $1
       AND s.school_id = $3
       AND s.status = 'active'
     LIMIT 1`,
    [studentId, staffId, schoolId]
  );

  return result.rows.length > 0;
}

async function teacherCanAccessSubject(
  schoolId: string,
  staffId: string,
  subjectId: string,
  classId: string
) {
  const result = await pool.query(
    `SELECT 1
     FROM teacher_subjects ts
     WHERE ts.school_id = $1
       AND ts.staff_id = $2
       AND ts.subject_id = $3
       AND (
         ts.class_id = $4
         OR ts.class_id IS NULL
       )
     LIMIT 1`,
    [schoolId, staffId, subjectId, classId]
  );

  return result.rows.length > 0;
}

async function getCurrentSessionAndTerm(schoolId: string) {
  const sessionResult = await pool.query(
    `SELECT id, name
     FROM academic_sessions
     WHERE school_id = $1
       AND is_current = TRUE
     LIMIT 1`,
    [schoolId]
  );

  const session = sessionResult.rows[0];

  if (!session) {
    return null;
  }

  const termResult = await pool.query(
    `SELECT id, name
     FROM terms
     WHERE school_id = $1
       AND academic_session_id = $2
       AND is_current = TRUE
     LIMIT 1`,
    [schoolId, session.id]
  );

  const term = termResult.rows[0];

  if (!term) {
    return null;
  }

  return { session, term };
}

export async function GET(request: NextRequest) {
  try {
    const teacher = await getCurrentTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const classId =
      request.nextUrl.searchParams.get("class_id") || "";

    const subjectId =
      request.nextUrl.searchParams.get("subject_id") || "";

    if (!classId || !subjectId) {
      return NextResponse.json(
        { error: "class_id and subject_id are required." },
        { status: 400 }
      );
    }

    const classAccess = await pool.query(
      `SELECT c.id, c.name
       FROM classes c
       INNER JOIN class_teachers ct
         ON ct.class_id = c.id
        AND ct.school_id = c.school_id
        AND ct.staff_id = $2
       WHERE c.id = $3
         AND c.school_id = $1
         AND c.status = 'active'
       LIMIT 1`,
      [teacher.schoolId, teacher.staffId, classId]
    );

    if (!classAccess.rows[0]) {
      return NextResponse.json(
        { error: "You are not assigned to this class." },
        { status: 403 }
      );
    }

    const subjectAccess = await teacherCanAccessSubject(
      teacher.schoolId,
      teacher.staffId,
      subjectId,
      classId
    );

    if (!subjectAccess) {
      return NextResponse.json(
        { error: "You are not assigned to this subject for this class." },
        { status: 403 }
      );
    }

    const current = await getCurrentSessionAndTerm(
      teacher.schoolId
    );

    if (!current) {
      return NextResponse.json(
        { error: "Current academic session or term is not configured." },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `SELECT
         s.id,
         s.admission_number,
         s.first_name,
         s.last_name,
         s.other_name,
         s.gender,
         s.photo_url,
         r.id AS result_id,
         r.ca_score,
         r.exam_score,
         r.total_score,
         r.grade,
         r.remarks,
         r.academic_session_id,
         r.term_id,
         r.subject_id
       FROM students s
       LEFT JOIN results r
         ON r.student_id = s.id
        AND r.school_id = s.school_id
        AND r.academic_session_id = $3
        AND r.term_id = $4
        AND r.subject_id = $5
       WHERE s.school_id = $1
         AND s.class_id = $2
         AND s.status = 'active'
       ORDER BY s.first_name ASC, s.last_name ASC`,
      [
        teacher.schoolId,
        classId,
        current.session.id,
        current.term.id,
        subjectId,
      ]
    );

    return NextResponse.json({
      session: current.session,
      term: current.term,
      class: classAccess.rows[0],
      results: result.rows,
    });
  } catch (error) {
    console.error("Teacher results GET error:", error);

    return NextResponse.json(
      { error: "Failed to load results." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacher = await getCurrentTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const studentId =
      typeof body.student_id === "string"
        ? body.student_id
        : "";

    const subjectId =
      typeof body.subject_id === "string"
        ? body.subject_id
        : "";

    const academicSessionId =
      typeof body.academic_session_id === "string"
        ? body.academic_session_id
        : "";

    const termId =
      typeof body.term_id === "string"
        ? body.term_id
        : "";

    const classId =
      typeof body.class_id === "string"
        ? body.class_id
        : "";

    const ca = Number(body.ca_score);
    const exam = Number(body.exam_score);

    const grade =
      typeof body.grade === "string"
        ? body.grade.trim().toUpperCase()
        : null;

    const remarks =
      typeof body.remarks === "string"
        ? body.remarks.trim()
        : null;

    if (
      !studentId ||
      !subjectId ||
      !academicSessionId ||
      !termId ||
      !classId ||
      body.ca_score === undefined ||
      body.exam_score === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required result fields." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(ca) ||
      !Number.isFinite(exam) ||
      ca < 0 ||
      ca > 40 ||
      exam < 0 ||
      exam > 60
    ) {
      return NextResponse.json(
        { error: "CA score must be 0-40 and exam score must be 0-60." },
        { status: 400 }
      );
    }

    if (grade && !VALID_GRADES.includes(grade)) {
      return NextResponse.json(
        { error: "Invalid grade." },
        { status: 400 }
      );
    }

    const classAccess = await pool.query(
      `SELECT 1
       FROM class_teachers
       WHERE school_id = $1
         AND staff_id = $2
         AND class_id = $3
       LIMIT 1`,
      [teacher.schoolId, teacher.staffId, classId]
    );

    if (!classAccess.rows[0]) {
      return NextResponse.json(
        { error: "You are not assigned to this class." },
        { status: 403 }
      );
    }

    const studentAccess = await teacherCanAccessStudent(
      teacher.schoolId,
      teacher.staffId,
      studentId
    );

    if (!studentAccess) {
      return NextResponse.json(
        { error: "You are not authorized to enter this student's result." },
        { status: 403 }
      );
    }

    const subjectAccess = await teacherCanAccessSubject(
      teacher.schoolId,
      teacher.staffId,
      subjectId,
      classId
    );

    if (!subjectAccess) {
      return NextResponse.json(
        { error: "You are not assigned to this subject for this class." },
        { status: 403 }
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
        teacher.schoolId,
        studentId,
        academicSessionId,
        termId,
        subjectId,
        ca,
        exam,
        grade,
        remarks,
      ]
    );

    const createdResult = result.rows[0];

    const namesResult = await pool.query(
      `SELECT
         s.name AS subject_name,
         a.name AS session_name,
         t.name AS term_name
       FROM subjects s
       INNER JOIN academic_sessions a
         ON a.id = $1
        AND a.school_id = $2
       INNER JOIN terms t
         ON t.id = $3
        AND t.school_id = $2
       WHERE s.id = $4
         AND s.school_id = $2
       LIMIT 1`,
      [
        academicSessionId,
        teacher.schoolId,
        termId,
        subjectId,
      ]
    );

    const names = namesResult.rows[0];

    if (names) {
      await notifyStudentAboutResult({
        schoolId: teacher.schoolId,
        studentId,
        resultId: createdResult.id,
        subjectName: names.subject_name,
        sessionName: names.session_name,
        termName: names.term_name,
      });

      await notifyParentsAboutStudentEvent({
        schoolId: teacher.schoolId,
        studentId,
        title: `New ${names.subject_name} result`,
        message: `A new ${names.subject_name} result for ${names.term_name}, ${names.session_name} is now available for your child.`,
        type: "result",
        link: "/parent/results",
      });
    }

    return NextResponse.json(
      { result: createdResult },
      { status: 201 }
    );
  } catch (error: unknown) {
    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          error:
            "A result already exists for this student, subject, session and term.",
        },
        { status: 409 }
      );
    }

    console.error("Teacher results POST error:", error);

    return NextResponse.json(
      { error: "Failed to create result." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const teacher = await getCurrentTeacher();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const resultId =
      typeof body.result_id === "string"
        ? body.result_id
        : "";

    const ca = Number(body.ca_score);
    const exam = Number(body.exam_score);

    const grade =
      typeof body.grade === "string"
        ? body.grade.trim().toUpperCase()
        : null;

    const remarks =
      typeof body.remarks === "string"
        ? body.remarks.trim()
        : null;

    if (
      !resultId ||
      body.ca_score === undefined ||
      body.exam_score === undefined
    ) {
      return NextResponse.json(
        { error: "Result ID, CA score and exam score are required." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(ca) ||
      !Number.isFinite(exam) ||
      ca < 0 ||
      ca > 40 ||
      exam < 0 ||
      exam > 60
    ) {
      return NextResponse.json(
        { error: "CA score must be 0-40 and exam score must be 0-60." },
        { status: 400 }
      );
    }

    if (grade && !VALID_GRADES.includes(grade)) {
      return NextResponse.json(
        { error: "Invalid grade." },
        { status: 400 }
      );
    }

    const access = await pool.query(
      `SELECT
         r.id
       FROM results r
       INNER JOIN students s
         ON s.id = r.student_id
        AND s.school_id = r.school_id
       INNER JOIN class_teachers ct
         ON ct.class_id = s.class_id
        AND ct.school_id = s.school_id
        AND ct.staff_id = $2
       INNER JOIN teacher_subjects ts
         ON ts.subject_id = r.subject_id
        AND ts.school_id = r.school_id
        AND ts.staff_id = $2
        AND (
          ts.class_id = s.class_id
          OR ts.class_id IS NULL
        )
       WHERE r.id = $1
         AND r.school_id = $3
       LIMIT 1`,
      [resultId, teacher.staffId, teacher.schoolId]
    );

    if (!access.rows[0]) {
      return NextResponse.json(
        { error: "You are not authorized to edit this result." },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `UPDATE results
       SET
         ca_score = $2,
         exam_score = $3,
         grade = $4,
         remarks = $5
       WHERE id = $1
         AND school_id = $6
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
        resultId,
        ca,
        exam,
        grade,
        remarks,
        teacher.schoolId,
      ]
    );

    return NextResponse.json({
      result: result.rows[0],
    });
  } catch (error) {
    console.error("Teacher results PUT error:", error);

    return NextResponse.json(
      { error: "Failed to update result." },
      { status: 500 }
    );
  }
}
