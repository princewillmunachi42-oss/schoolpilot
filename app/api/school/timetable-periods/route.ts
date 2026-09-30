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
