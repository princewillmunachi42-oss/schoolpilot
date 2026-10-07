import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentTeacher } from "@/lib/auth/teacher";
import { notifyParentsAboutStudentEvent } from "@/lib/notifications/parents";

const VALID_STATUSES = [
  "present",
  "absent",
  "late",
  "excused",
] as const;

async function teacherCanAccessStudent(
  schoolId: string,
  staffId: string,
  studentId: string
) {
  const result = await pool.query(
    `SELECT s.id
     FROM students s
     INNER JOIN class_teachers ct
       ON ct.class_id = s.class_id
      AND ct.school_id = s.school_id
      AND ct.staff_id = $2
     INNER JOIN classes c
       ON c.id = s.class_id
      AND c.school_id = s.school_id
     WHERE s.id = $3
       AND s.school_id = $1
       AND s.status = 'active'
       AND c.status = 'active'
     LIMIT 1`,
    [schoolId, staffId, studentId]
  );

  return Boolean(result.rows[0]);
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

    const classId = request.nextUrl.searchParams.get("class_id");
    const attendanceDate =
      request.nextUrl.searchParams.get("attendance_date");

    if (!classId) {
      return NextResponse.json(
        { error: "class_id is required" },
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
      const teacherClass = classAccess.rows[0];

    if (!teacherClass) {
      return NextResponse.json(
        { error: "You are not assigned to this class." },
        { status: 403 }
      );
    }

    const studentsResult = await pool.query(
      `SELECT
         s.id,
         s.admission_number,
         s.first_name,
         s.last_name,
         s.other_name,
         s.gender,
         s.photo_url,
         ar.id AS attendance_id,
         ar.attendance_date,
         ar.status AS attendance_status,
         ar.remarks AS attendance_remarks
       FROM students s
       LEFT JOIN attendance_records ar
         ON ar.student_id = s.id
        AND ar.school_id = s.school_id
        AND (
          $3::date IS NULL
          OR ar.attendance_date = $3::date
        )
       WHERE s.school_id = $1
         AND s.class_id = $2
         AND s.status = 'active'
       ORDER BY s.first_name ASC, s.last_name ASC`,
      [
        teacher.schoolId,
        classId,
        attendanceDate || null,
      ]
    );

    return NextResponse.json({
      class: teacherClass,
      students: studentsResult.rows,
    });
  } catch (error) {
    console.error("Teacher attendance GET error:", error);

    return NextResponse.json(
      { error: "Failed to load attendance." },
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

    const academicSessionId =
      typeof body.academic_session_id === "string"
        ? body.academic_session_id
        : "";

    const termId =
      typeof body.term_id === "string"
        ? body.term_id
        : "";

    const attendanceDate =
      typeof body.attendance_date === "string"
        ? body.attendance_date
        : "";

    const status =
      typeof body.status === "string"
        ? body.status
        : "";

    const remarks =
      typeof body.remarks === "string"
        ? body.remarks.trim()
        : null;

    if (
      !studentId ||
      !academicSessionId ||
      !termId ||
      !attendanceDate ||
      !status
    ) {
      return NextResponse.json(
        { error: "Missing required attendance fields." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid attendance status." },
        { status: 400 }
      );
    }

    const canAccess = await teacherCanAccessStudent(
      teacher.schoolId,
      teacher.staffId,
      studentId
    );

    if (!canAccess) {
      return NextResponse.json(
        { error: "You are not authorized to mark this student." },
        { status: 403 }
      );
    }

    const sessionTerm = await pool.query(
      `SELECT a.id AS academic_session_id, t.id AS term_id
       FROM academic_sessions a
       INNER JOIN terms t
         ON t.academic_session_id = a.id
        AND t.school_id = a.school_id
       WHERE a.id = $1
         AND t.id = $2
         AND a.school_id = $3
       LIMIT 1`,
      [academicSessionId, termId, teacher.schoolId]
    );

    if (!sessionTerm.rows[0]) {
      return NextResponse.json(
        { error: "Invalid academic session or term." },
        { status: 400 }
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
        teacher.schoolId,
        studentId,
        academicSessionId,
        termId,
        attendanceDate,
        status,
        remarks,
      ]
    );

    await notifyParentsAboutStudentEvent({
      schoolId: teacher.schoolId,
      studentId,
      title: `Attendance update: ${status}`,
      message: `Your child was marked ${status.toLowerCase()} on ${new Date(attendanceDate).toLocaleDateString("en-NG")}.`,
      type: "attendance",
      link: "/parent/attendance",
    });

    return NextResponse.json(
      { attendance: result.rows[0] },
      { status: 201 }
    );
  } catch (error: unknown) {
    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          error:
            "Attendance has already been recorded for this student on this date.",
        },
        { status: 409 }
      );
    }

    console.error("Teacher attendance POST error:", error);

    return NextResponse.json(
      { error: "Failed to save attendance." },
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

    const attendanceId =
      typeof body.attendance_id === "string"
        ? body.attendance_id
        : "";

    const status =
      typeof body.status === "string"
        ? body.status
        : "";

    const remarks =
      typeof body.remarks === "string"
        ? body.remarks.trim()
        : null;

    if (!attendanceId || !status) {
      return NextResponse.json(
        { error: "Attendance ID and status are required." },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid attendance status." },
        { status: 400 }
      );
    }

    const attendanceResult = await pool.query(
      `SELECT
         ar.id,
         ar.student_id,
         ar.attendance_date
       FROM attendance_records ar
       INNER JOIN students s
         ON s.id = ar.student_id
        AND s.school_id = ar.school_id
       INNER JOIN class_teachers ct
         ON ct.class_id = s.class_id
        AND ct.school_id = s.school_id
        AND ct.staff_id = $2
       WHERE ar.id = $1
         AND ar.school_id = $3
       LIMIT 1`,
      [
        attendanceId,
        teacher.staffId,
        teacher.schoolId,
      ]
    );

    if (!attendanceResult.rows[0]) {
      return NextResponse.json(
        { error: "You are not authorized to edit this attendance record." },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `UPDATE attendance_records
       SET
         status = $2,
         remarks = $3
       WHERE id = $1
         AND school_id = $4
       RETURNING
         id,
         student_id,
         attendance_date,
         status,
         remarks,
         academic_session_id,
         term_id`,
      [
        attendanceId,
        status,
        remarks,
        teacher.schoolId,
      ]
    );

    return NextResponse.json({
      attendance: result.rows[0],
    });
  } catch (error) {
    console.error("Teacher attendance PUT error:", error);

    return NextResponse.json(
      { error: "Failed to update attendance." },
      { status: 500 }
    );
  }
}
