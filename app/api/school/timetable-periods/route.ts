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
          id,
          name,
          period_number,
          start_time,
          end_time,
          is_break,
          is_active,
          created_at
        FROM timetable_periods
        WHERE school_id = $1
        ORDER BY period_number ASC
      `,
      [schoolId]
    );

    return NextResponse.json({
      success: true,
      periods: result.rows,
    });
  } catch (error) {
    console.error("GET timetable periods error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load timetable periods",
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

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const periodNumber = Number(body.periodNumber);

    const startTime =
      typeof body.startTime === "string"
        ? body.startTime.trim()
        : "";

    const endTime =
      typeof body.endTime === "string"
        ? body.endTime.trim()
        : "";

    const isBreak = Boolean(body.isBreak);

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Period name is required",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(periodNumber) || periodNumber < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Period number must be a positive integer",
        },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "Start time and end time are required",
        },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        {
          success: false,
          message: "End time must be after start time",
        },
        { status: 400 }
      );
    }

    const duplicate = await pool.query(
      `
        SELECT id
        FROM timetable_periods
        WHERE school_id = $1
          AND period_number = $2
        LIMIT 1
      `,
      [schoolId, periodNumber]
    );

    if (duplicate.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: `Period number ${periodNumber} already exists`,
        },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO timetable_periods (
          school_id,
          name,
          period_number,
          start_time,
          end_time,
          is_break
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING
          id,
          name,
          period_number,
          start_time,
          end_time,
          is_break,
          is_active,
          created_at
      `,
      [
        schoolId,
        name,
        periodNumber,
        startTime,
        endTime,
        isBreak,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        period: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST timetable period error:", error);

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "That period number already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create timetable period",
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

    const id = typeof body.id === "string" ? body.id : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const periodNumber = Number(body.periodNumber);
    const startTime =
      typeof body.startTime === "string" ? body.startTime.trim() : "";
    const endTime =
      typeof body.endTime === "string" ? body.endTime.trim() : "";
    const isBreak = Boolean(body.isBreak);
    const isActive = body.isActive !== false;

    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: "Period ID and name are required" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(periodNumber) || periodNumber < 1) {
      return NextResponse.json(
        { success: false, message: "Period number must be a positive integer" },
        { status: 400 }
      );
    }

    if (!startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "Start time and end time are required" },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        { success: false, message: "End time must be after start time" },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      `
        SELECT id
        FROM timetable_periods
        WHERE id = $1 AND school_id = $2
        LIMIT 1
      `,
      [id, schoolId]
    );

    if (!existing.rowCount) {
      return NextResponse.json(
        { success: false, message: "Timetable period not found" },
        { status: 404 }
      );
    }

    const duplicate = await pool.query(
      `
        SELECT id
        FROM timetable_periods
        WHERE school_id = $1
          AND period_number = $2
          AND id <> $3
        LIMIT 1
      `,
      [schoolId, periodNumber, id]
    );

    if (duplicate.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: `Period number ${periodNumber} already exists`,
        },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `
        UPDATE timetable_periods
        SET
          name = $1,
          period_number = $2,
          start_time = $3,
          end_time = $4,
          is_break = $5,
          is_active = $6
        WHERE id = $7
          AND school_id = $8
        RETURNING
          id,
          name,
          period_number,
          start_time,
          end_time,
          is_break,
          is_active,
          created_at
      `,
      [
        name,
        periodNumber,
        startTime,
        endTime,
        isBreak,
        isActive,
        id,
        schoolId,
      ]
    );

    return NextResponse.json({
      success: true,
      period: result.rows[0],
    });
  } catch (error: any) {
    console.error("PUT timetable period error:", error);

    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "That period number already exists",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update timetable period",
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
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Period ID is required" },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      `
        SELECT id
        FROM timetable_periods
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [id, schoolId]
    );

    if (!existing.rowCount) {
      return NextResponse.json(
        { success: false, message: "Timetable period not found" },
        { status: 404 }
      );
    }

    const used = await pool.query(
      `
        SELECT id
        FROM timetable_entries
        WHERE period_id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [id, schoolId]
    );

    if (used.rowCount) {
      return NextResponse.json(
        {
          success: false,
          message: "This period is already used by a timetable lesson and cannot be deleted.",
        },
        { status: 409 }
      );
    }

    await pool.query(
      `
        DELETE FROM timetable_periods
        WHERE id = $1
          AND school_id = $2
      `,
      [id, schoolId]
    );

    return NextResponse.json({
      success: true,
      message: "Timetable period deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE timetable period error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete timetable period",
      },
      { status: 500 }
    );
  }
}
