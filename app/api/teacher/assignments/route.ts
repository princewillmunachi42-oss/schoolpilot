import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentTeacher } from "@/lib/auth/teacher";
import { notifyStudentsAboutAssignment } from "@/lib/notifications/assignments";
async function getTeacherContext() {
  const teacher = await getCurrentTeacher();

  if (!teacher) {
    return null;
  }

  return teacher;
}

async function teacherCanUseClassAndSubject(
  schoolId: string,
  staffId: string,
  classId: string,
  subjectId: string
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

  return (result.rowCount ?? 0) > 0;
}

export async function GET() {
  try {
    const teacher = await getTeacherContext();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `SELECT
         a.id,
         a.title,
         a.description,
         a.due_date,
         a.status,
         a.created_at,
         a.updated_at,
         a.class_id,
         c.name AS class_name,
         a.subject_id,
         s.name AS subject_name
       FROM assignments a
       INNER JOIN classes c
         ON c.id = a.class_id
        AND c.school_id = a.school_id
       INNER JOIN subjects s
         ON s.id = a.subject_id
        AND s.school_id = a.school_id
       WHERE a.school_id = $1
         AND a.staff_id = $2
       ORDER BY
         a.created_at DESC,
         a.title ASC`,
      [teacher.schoolId, teacher.staffId]
    );

    return NextResponse.json({
      assignments: result.rows,
    });
  } catch (error) {
    console.error("Teacher assignments GET error:", error);

    return NextResponse.json(
      { error: "Failed to load assignments." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const teacher = await getTeacherContext();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const classId = String(body.class_id ?? "").trim();
    const subjectId = String(body.subject_id ?? "").trim();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const dueDate = body.due_date
      ? String(body.due_date).trim()
      : null;
    const status = String(body.status ?? "draft").trim();

    if (!classId || !subjectId || !title) {
      return NextResponse.json(
        {
          error: "Class, subject, and title are required.",
        },
        { status: 400 }
      );
    }

    if (!["draft", "published"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid assignment status." },
        { status: 400 }
      );
    }

    const classCheck = await pool.query(
      `SELECT id
       FROM classes
       WHERE id = $1
         AND school_id = $2
         AND status = 'active'
       LIMIT 1`,
      [classId, teacher.schoolId]
    );

    if (!classCheck.rows[0]) {
      return NextResponse.json(
        { error: "Class not found." },
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
      [subjectId, teacher.schoolId]
    );

    if (!subjectCheck.rows[0]) {
      return NextResponse.json(
        { error: "Subject not found." },
        { status: 404 }
      );
    }

    const authorized = await teacherCanUseClassAndSubject(
      teacher.schoolId,
      teacher.staffId,
      classId,
      subjectId
    );

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to teach this subject for this class.",
        },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `INSERT INTO assignments (
         school_id,
         staff_id,
         class_id,
         subject_id,
         title,
         description,
         due_date,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING
         id,
         title,
         description,
         due_date,
         status,
         class_id,
         subject_id,
         created_at,
         updated_at`,
      [
        teacher.schoolId,
        teacher.staffId,
        classId,
        subjectId,
        title,
        description || null,
        dueDate,
        status,
      ]
    );

    const assignment = result.rows[0];

    if (status === "published") {
      const subjectResult = await pool.query(
        `SELECT name
         FROM subjects
         WHERE id = $1
           AND school_id = $2
         LIMIT 1`,
        [subjectId, teacher.schoolId]
      );

      const subjectName =
        subjectResult.rows[0]?.name ?? "Subject";

      await notifyStudentsAboutAssignment({
        schoolId: teacher.schoolId,
        assignmentId: assignment.id,
        classId,
        title: assignment.title,
        subjectName,
      });
    }

    return NextResponse.json(
      { assignment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Teacher assignments POST error:", error);

    return NextResponse.json(
      { error: "Failed to create assignment." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const teacher = await getTeacherContext();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(body.id ?? "").trim();
    const classId = String(body.class_id ?? "").trim();
    const subjectId = String(body.subject_id ?? "").trim();
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const dueDate = body.due_date
      ? String(body.due_date).trim()
      : null;
    const status = String(body.status ?? "draft").trim();

    if (!id || !classId || !subjectId || !title) {
      return NextResponse.json(
        {
          error:
            "Assignment ID, class, subject, and title are required.",
        },
        { status: 400 }
      );
    }

    if (!["draft", "published"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid assignment status." },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      `SELECT
         id,
         status,
         class_id,
         subject_id,
         title
       FROM assignments
       WHERE id = $1
         AND school_id = $2
         AND staff_id = $3
       LIMIT 1`,
      [id, teacher.schoolId, teacher.staffId]
    );

    if (!existing.rows[0]) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    const authorized = await teacherCanUseClassAndSubject(
      teacher.schoolId,
      teacher.staffId,
      classId,
      subjectId
    );

    if (!authorized) {
      return NextResponse.json(
        {
          error:
            "You are not assigned to teach this subject for this class.",
        },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `UPDATE assignments
       SET
         class_id = $1,
         subject_id = $2,
         title = $3,
         description = $4,
         due_date = $5,
         status = $6,
         updated_at = now()
       WHERE id = $7
         AND school_id = $8
         AND staff_id = $9
       RETURNING
         id,
         title,
         description,
         due_date,
         status,
         class_id,
         subject_id,
         created_at,
         updated_at`,
      [
        classId,
        subjectId,
        title,
        description || null,
        dueDate,
        status,
        id,
        teacher.schoolId,
        teacher.staffId,
      ]
    );

    const assignment = result.rows[0];

    const wasDraft = existing.rows[0].status === "draft";
    const isNowPublished = assignment.status === "published";

    if (wasDraft && isNowPublished) {
      const subjectResult = await pool.query(
        `SELECT name
         FROM subjects
         WHERE id = $1
           AND school_id = $2
         LIMIT 1`,
        [assignment.subject_id, teacher.schoolId]
      );

      const subjectName =
        subjectResult.rows[0]?.name ?? "Subject";

      await notifyStudentsAboutAssignment({
        schoolId: teacher.schoolId,
        assignmentId: assignment.id,
        classId: assignment.class_id,
        title: assignment.title,
        subjectName,
      });
    }

    return NextResponse.json({
      assignment,
    });
  } catch (error) {
    console.error("Teacher assignments PUT error:", error);

    return NextResponse.json(
      { error: "Failed to update assignment." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const teacher = await getTeacherContext();

    if (!teacher) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Assignment ID is required." },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `DELETE FROM assignments
       WHERE id = $1
         AND school_id = $2
         AND staff_id = $3
       RETURNING id`,
      [id, teacher.schoolId, teacher.staffId]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Teacher assignments DELETE error:", error);

    return NextResponse.json(
      { error: "Failed to delete assignment." },
      { status: 500 }
    );
  }
}
