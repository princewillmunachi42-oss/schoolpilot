import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

async function getOwnerSchool(userId: string) {
  const result = await pool.query(
    `
      SELECT school_id
      FROM school_members
      WHERE user_id = $1
        AND role = 'owner'
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0]?.school_id ?? null;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = await getOwnerSchool(user.id);

    if (!schoolId) {
      return NextResponse.json(
        { success: false, message: "Owner access required" },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `
        SELECT
          te.id,
          te.day_of_week,
          te.room,
          te.is_active,
          te.period_id,
          te.class_id,
          te.subject_id,
          te.staff_id,

          tp.name AS period_name,
          tp.period_number,
          tp.start_time,
          tp.end_time,
          tp.is_break,

          c.name AS class_name,

          s.name AS subject_name,
          s.code AS subject_code,

          st.staff_id AS teacher_staff_id,
          st.first_name AS teacher_first_name,
          st.last_name AS teacher_last_name

        FROM timetable_entries te

        JOIN timetable_periods tp
          ON tp.id = te.period_id
         AND tp.school_id = te.school_id

        JOIN classes c
          ON c.id = te.class_id
         AND c.school_id = te.school_id

        JOIN subjects s
          ON s.id = te.subject_id
         AND s.school_id = te.school_id

        JOIN staff st
          ON st.id = te.staff_id
         AND st.school_id = te.school_id

        WHERE te.school_id = $1

        ORDER BY
          te.day_of_week,
          tp.period_number,
          c.name
      `,
      [schoolId]
    );

    return NextResponse.json({
      success: true,
      entries: result.rows,
    });
  } catch (error) {
    console.error("GET timetable entries error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load timetable entries",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = await getOwnerSchool(user.id);

    if (!schoolId) {
      return NextResponse.json(
        { success: false, message: "Owner access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const periodId =
      typeof body.periodId === "string" ? body.periodId : "";

    const classId =
      typeof body.classId === "string" ? body.classId : "";

    const subjectId =
      typeof body.subjectId === "string" ? body.subjectId : "";

    const staffId =
      typeof body.staffId === "string" ? body.staffId : "";

    const dayOfWeek = Number(body.dayOfWeek);

    const room =
      typeof body.room === "string"
        ? body.room.trim()
        : null;

    if (
      !periodId ||
      !classId ||
      !subjectId ||
      !staffId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Period, class, subject, and teacher are required",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > 7
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Day must be between 1 and 7",
        },
        { status: 400 }
      );
    }

    const period = await pool.query(
      `
        SELECT id
        FROM timetable_periods
        WHERE id = $1
          AND school_id = $2
          AND is_active = TRUE
        LIMIT 1
      `,
      [periodId, schoolId]
    );

    if (!period.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or inactive timetable period",
        },
        { status: 400 }
      );
    }

    const classResult = await pool.query(
      `
        SELECT id
        FROM classes
        WHERE id = $1
          AND school_id = $2
          AND status = 'active'
        LIMIT 1
      `,
      [classId, schoolId]
    );

    if (!classResult.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or inactive class",
        },
        { status: 400 }
      );
    }

    const subjectResult = await pool.query(
      `
        SELECT id
        FROM subjects
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [subjectId, schoolId]
    );

    if (!subjectResult.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid subject",
        },
        { status: 400 }
      );
    }

    const staffResult = await pool.query(
      `
        SELECT id
        FROM staff
        WHERE id = $1
          AND school_id = $2
          AND status = 'active'
        LIMIT 1
      `,
      [staffId, schoolId]
    );

    if (!staffResult.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or inactive teacher",
        },
        { status: 400 }
      );
    }

    const assignment = await pool.query(
      `
        SELECT id
        FROM teacher_subjects
        WHERE school_id = $1
          AND staff_id = $2
          AND subject_id = $3
          AND (class_id = $4 OR class_id IS NULL)
        LIMIT 1
      `,
      [schoolId, staffId, subjectId, classId]
    );

    if (!assignment.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This teacher is not assigned to this subject and class",
        },
        { status: 400 }
      );
    }

    const classConflict = await pool.query(
      `
        SELECT id
        FROM timetable_entries
        WHERE school_id = $1
          AND day_of_week = $2
          AND period_id = $3
          AND class_id = $4
        LIMIT 1
      `,
      [
        schoolId,
        dayOfWeek,
        periodId,
        classId,
      ]
    );

    if (classConflict.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This class already has a lesson in that period",
        },
        { status: 409 }
      );
    }

    const teacherConflict = await pool.query(
      `
        SELECT id
        FROM timetable_entries
        WHERE school_id = $1
          AND day_of_week = $2
          AND period_id = $3
          AND staff_id = $4
        LIMIT 1
      `,
      [
        schoolId,
        dayOfWeek,
        periodId,
        staffId,
      ]
    );

    if (teacherConflict.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This teacher is already teaching another class in that period",
        },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO timetable_entries (
          school_id,
          period_id,
          day_of_week,
          class_id,
          subject_id,
          staff_id,
          room
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        RETURNING *
      `,
      [
        schoolId,
        periodId,
        dayOfWeek,
        classId,
        subjectId,
        staffId,
        room,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        entry: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST timetable entry error:", error);

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message:
            "That timetable slot is already occupied",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create timetable entry",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = await getOwnerSchool(user.id);

    if (!schoolId) {
      return NextResponse.json(
        { success: false, message: "Owner access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id =
      typeof body.id === "string" ? body.id : "";

    const periodId =
      typeof body.periodId === "string"
        ? body.periodId
        : "";

    const classId =
      typeof body.classId === "string"
        ? body.classId
        : "";

    const subjectId =
      typeof body.subjectId === "string"
        ? body.subjectId
        : "";

    const staffId =
      typeof body.staffId === "string"
        ? body.staffId
        : "";

    const dayOfWeek = Number(body.dayOfWeek);

    const room =
      typeof body.room === "string"
        ? body.room.trim()
        : null;

    if (
      !id ||
      !periodId ||
      !classId ||
      !subjectId ||
      !staffId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Entry, period, class, subject, and teacher are required",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 1 ||
      dayOfWeek > 7
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Day must be between 1 and 7",
        },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      `
        SELECT id
        FROM timetable_entries
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [id, schoolId]
    );

    if (!existing.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Timetable entry not found",
        },
        { status: 404 }
      );
    }

    const period = await pool.query(
      `
        SELECT id
        FROM timetable_periods
        WHERE id = $1
          AND school_id = $2
          AND is_active = TRUE
        LIMIT 1
      `,
      [periodId, schoolId]
    );

    if (!period.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or inactive timetable period",
        },
        { status: 400 }
      );
    }

    const classResult = await pool.query(
      `
        SELECT id
        FROM classes
        WHERE id = $1
          AND school_id = $2
          AND status = 'active'
        LIMIT 1
      `,
      [classId, schoolId]
    );

    if (!classResult.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or inactive class",
        },
        { status: 400 }
      );
    }

    const subjectResult = await pool.query(
      `
        SELECT id
        FROM subjects
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [subjectId, schoolId]
    );

    if (!subjectResult.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid subject",
        },
        { status: 400 }
      );
    }

    const staffResult = await pool.query(
      `
        SELECT id
        FROM staff
        WHERE id = $1
          AND school_id = $2
          AND status = 'active'
        LIMIT 1
      `,
      [staffId, schoolId]
    );

    if (!staffResult.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or inactive teacher",
        },
        { status: 400 }
      );
    }

    const assignment = await pool.query(
      `
        SELECT id
        FROM teacher_subjects
        WHERE school_id = $1
          AND staff_id = $2
          AND subject_id = $3
          AND (class_id = $4 OR class_id IS NULL)
        LIMIT 1
      `,
      [schoolId, staffId, subjectId, classId]
    );

    if (!assignment.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This teacher is not assigned to this subject and class",
        },
        { status: 400 }
      );
    }

    const classConflict = await pool.query(
      `
        SELECT id
        FROM timetable_entries
        WHERE school_id = $1
          AND day_of_week = $2
          AND period_id = $3
          AND class_id = $4
          AND id <> $5
        LIMIT 1
      `,
      [
        schoolId,
        dayOfWeek,
        periodId,
        classId,
        id,
      ]
    );

    if (classConflict.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This class already has a lesson in that period",
        },
        { status: 409 }
      );
    }

    const teacherConflict = await pool.query(
      `
        SELECT id
        FROM timetable_entries
        WHERE school_id = $1
          AND day_of_week = $2
          AND period_id = $3
          AND staff_id = $4
          AND id <> $5
        LIMIT 1
      `,
      [
        schoolId,
        dayOfWeek,
        periodId,
        staffId,
        id,
      ]
    );

    if (teacherConflict.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This teacher is already teaching another class in that period",
        },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `
        UPDATE timetable_entries
        SET
          period_id = $1,
          day_of_week = $2,
          class_id = $3,
          subject_id = $4,
          staff_id = $5,
          room = $6
        WHERE id = $7
          AND school_id = $8
        RETURNING *
      `,
      [
        periodId,
        dayOfWeek,
        classId,
        subjectId,
        staffId,
        room,
        id,
        schoolId,
      ]
    );

    return NextResponse.json({
      success: true,
      entry: result.rows[0],
    });
  } catch (error: any) {
    console.error("PUT timetable entry error:", error);

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message:
            "That timetable slot is already occupied",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update timetable entry",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const schoolId = await getOwnerSchool(user.id);

    if (!schoolId) {
      return NextResponse.json(
        { success: false, message: "Owner access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id =
      typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Timetable entry ID is required",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        DELETE FROM timetable_entries
        WHERE id = $1
          AND school_id = $2
        RETURNING id
      `,
      [id, schoolId]
    );

    if (!result.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "Timetable entry not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Timetable lesson deleted successfully",
    });
  } catch (error) {
    console.error("DELETE timetable entry error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete timetable entry",
      },
      { status: 500 }
    );
  }
}
