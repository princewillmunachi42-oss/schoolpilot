import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getStaffAttendanceManager } from "@/lib/auth/staff-attendance";

function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

function serializeStation(row: Record<string, unknown>) {
  return {
    id: row.id,
    stationName: row.station_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const manager = await getStaffAttendanceManager();

  if (!manager) {
    return NextResponse.json(
      {
        success: false,
        message:
          "You are not authorized to manage staff attendance.",
      },
      { status: 403 }
    );
  }

  try {
    const result = await pool.query(
      `
        SELECT
          id,
          station_name,
          status,
          created_at,
          updated_at
        FROM staff_attendance_stations
        WHERE school_id = $1
        ORDER BY created_at ASC
      `,
      [manager.schoolId]
    );

    return NextResponse.json({
      success: true,
      stations: result.rows.map(serializeStation),
    });
  } catch (error) {
    console.error(
      "Staff attendance station GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load attendance stations.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const manager = await getStaffAttendanceManager();

  if (!manager) {
    return NextResponse.json(
      {
        success: false,
        message:
          "You are not authorized to manage staff attendance.",
      },
      { status: 403 }
    );
  }

  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const payload =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const stationName =
    typeof payload.stationName === "string"
      ? payload.stationName.trim()
      : "Main Entrance";

  if (!stationName) {
    return NextResponse.json(
      {
        success: false,
        message: "Station name is required.",
      },
      { status: 400 }
    );
  }

  if (stationName.length > 100) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Station name must be 100 characters or fewer.",
      },
      { status: 400 }
    );
  }

  try {
    const existing = await pool.query(
      `
        SELECT id
        FROM staff_attendance_stations
        WHERE school_id = $1
          AND station_name = $2
        LIMIT 1
      `,
      [manager.schoolId, stationName]
    );

    const rawToken = createToken();
    const tokenHash = hashToken(rawToken);

    if (existing.rows[0]) {
      const result = await pool.query(
        `
          UPDATE staff_attendance_stations
          SET
            token_hash = $1,
            status = 'active',
            updated_at = NOW()
          WHERE id = $2
            AND school_id = $3
          RETURNING
            id,
            station_name,
            status,
            created_at,
            updated_at
        `,
        [
          tokenHash,
          existing.rows[0].id,
          manager.schoolId,
        ]
      );

      return NextResponse.json({
        success: true,
        message:
          "A new attendance QR has been generated. The previous QR is now invalid.",
        station: {
          ...serializeStation(result.rows[0]),
          token: rawToken,
        },
        regenerated: true,
      });
    }

    const result = await pool.query(
      `
        INSERT INTO staff_attendance_stations (
          school_id,
          station_name,
          token_hash,
          status,
          created_by
        )
        VALUES ($1, $2, $3, 'active', $4)
        RETURNING
          id,
          station_name,
          status,
          created_at,
          updated_at
      `,
      [
        manager.schoolId,
        stationName,
        tokenHash,
        manager.userId,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Attendance QR generated successfully.",
        station: {
          ...serializeStation(result.rows[0]),
          token: rawToken,
        },
        regenerated: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Staff attendance station POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to generate attendance QR.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const manager = await getStaffAttendanceManager();

  if (!manager) {
    return NextResponse.json(
      {
        success: false,
        message:
          "You are not authorized to manage staff attendance.",
      },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const payload =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};

  const stationId =
    typeof payload.stationId === "string"
      ? payload.stationId
      : "";

  const action =
    typeof payload.action === "string"
      ? payload.action
      : "";

  if (!stationId) {
    return NextResponse.json(
      {
        success: false,
        message: "Station ID is required.",
      },
      { status: 400 }
    );
  }

  if (
    !["regenerate", "activate", "deactivate"].includes(
      action
    )
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Action must be regenerate, activate, or deactivate.",
      },
      { status: 400 }
    );
  }

  try {
    const existing = await pool.query(
      `
        SELECT
          id,
          station_name,
          status
        FROM staff_attendance_stations
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [stationId, manager.schoolId]
    );

    const station = existing.rows[0];

    if (!station) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance station not found.",
        },
        { status: 404 }
      );
    }

    if (
      action === "activate" ||
      action === "deactivate"
    ) {
      const status =
        action === "activate"
          ? "active"
          : "inactive";

      const result = await pool.query(
        `
          UPDATE staff_attendance_stations
          SET
            status = $1,
            updated_at = NOW()
          WHERE id = $2
            AND school_id = $3
          RETURNING
            id,
            station_name,
            status,
            created_at,
            updated_at
        `,
        [
          status,
          stationId,
          manager.schoolId,
        ]
      );

      return NextResponse.json({
        success: true,
        message:
          action === "activate"
            ? "Attendance QR activated."
            : "Attendance QR deactivated.",
        station: serializeStation(
          result.rows[0]
        ),
      });
    }

    const rawToken = createToken();
    const tokenHash = hashToken(rawToken);

    const result = await pool.query(
      `
        UPDATE staff_attendance_stations
        SET
          token_hash = $1,
          status = 'active',
          updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
        RETURNING
          id,
          station_name,
          status,
          created_at,
          updated_at
      `,
      [
        tokenHash,
        stationId,
        manager.schoolId,
      ]
    );

    return NextResponse.json({
      success: true,
      message:
        "New attendance QR generated. The previous QR is now permanently invalid.",
      station: {
        ...serializeStation(
          result.rows[0]
        ),
        token: rawToken,
      },
    });
  } catch (error) {
    console.error(
      "Staff attendance station PATCH error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update attendance QR.",
      },
      { status: 500 }
    );
  }
}
