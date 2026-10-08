import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getStaffAttendanceManager } from "@/lib/auth/staff-attendance";

const DEFAULT_SETTINGS = {
  clockInTime: null,
  clockOutTime: null,
  lateGraceMinutes: 15,
  timezone: "Africa/Lagos",
  mondayEnabled: true,
  tuesdayEnabled: true,
  wednesdayEnabled: true,
  thursdayEnabled: true,
  fridayEnabled: true,
  saturdayEnabled: false,
  sundayEnabled: false,
  latitude: null,
  longitude: null,
  geofenceRadiusMeters: 100,
  geofenceEnabled: true,
};

function isValidTime(value: unknown) {
  return (
    value === null ||
    value === "" ||
    (typeof value === "string" && /^\d{2}:\d{2}$/.test(value))
  );
}

function normalizeTime(value: unknown) {
  if (value === null || value === "") return null;
  return typeof value === "string" ? value : null;
}

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-GB", {
      timeZone: value,
    }).format(new Date());

    return true;
  } catch {
    return false;
  }
}

function isValidBoolean(value: unknown) {
  return typeof value === "boolean";
}

function isValidGraceMinutes(value: unknown) {
  return (
    Number.isInteger(value) &&
    Number(value) >= 0 &&
    Number(value) <= 240
  );
}

function isValidLatitude(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

function isValidLongitude(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

function isValidRadius(value: unknown) {
  return (
    Number.isInteger(value) &&
    Number(value) >= 20 &&
    Number(value) <= 5000
  );
}

function hasOwn(
  payload: Record<string, unknown>,
  field: string
) {
  return Object.prototype.hasOwnProperty.call(payload, field);
}

function normalizeCoordinate(
  value: unknown,
  field: "latitude" | "longitude"
) {
  if (value === null || value === "") return null;

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new Error(
      `${field === "latitude" ? "Latitude" : "Longitude"} must be a valid number.`
    );
  }

  if (
    field === "latitude" &&
    !isValidLatitude(value)
  ) {
    throw new Error("Latitude must be between -90 and 90.");
  }

  if (
    field === "longitude" &&
    !isValidLongitude(value)
  ) {
    throw new Error("Longitude must be between -180 and 180.");
  }

  return value;
}

function serializeSettings(row: Record<string, unknown>) {
  return {
    clockInTime: row.clock_in_time,
    clockOutTime: row.clock_out_time,
    lateGraceMinutes: Number(row.late_grace_minutes),
    timezone: row.timezone,
    mondayEnabled: row.monday_enabled,
    tuesdayEnabled: row.tuesday_enabled,
    wednesdayEnabled: row.wednesday_enabled,
    thursdayEnabled: row.thursday_enabled,
    fridayEnabled: row.friday_enabled,
    saturdayEnabled: row.saturday_enabled,
    sundayEnabled: row.sunday_enabled,
    latitude:
      row.latitude === null || row.latitude === undefined
        ? null
        : Number(row.latitude),
    longitude:
      row.longitude === null || row.longitude === undefined
        ? null
        : Number(row.longitude),
    geofenceRadiusMeters: Number(
      row.geofence_radius_meters ?? 100
    ),
    geofenceEnabled: Boolean(
      row.geofence_enabled ?? true
    ),
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
          clock_in_time,
          clock_out_time,
          late_grace_minutes,
          timezone,
          monday_enabled,
          tuesday_enabled,
          wednesday_enabled,
          thursday_enabled,
          friday_enabled,
          saturday_enabled,
          sunday_enabled,
          latitude,
          longitude,
          geofence_radius_meters,
          geofence_enabled
        FROM staff_attendance_settings
        WHERE school_id = $1
        LIMIT 1
      `,
      [manager.schoolId]
    );

    if (!result.rows[0]) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    return NextResponse.json({
      success: true,
      settings: serializeSettings(result.rows[0]),
    });
  } catch (error) {
    console.error(
      "Staff attendance settings GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load staff attendance settings.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

  const clockInTime = normalizeTime(payload.clockInTime);
  const clockOutTime = normalizeTime(payload.clockOutTime);

  if (!isValidTime(payload.clockInTime)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Clock-in time must use HH:MM format.",
      },
      { status: 400 }
    );
  }

  if (!isValidTime(payload.clockOutTime)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Clock-out time must use HH:MM format.",
      },
      { status: 400 }
    );
  }

  const lateGraceMinutes = payload.lateGraceMinutes;

  if (!isValidGraceMinutes(lateGraceMinutes)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Grace period must be between 0 and 240 minutes.",
      },
      { status: 400 }
    );
  }

  const timezone =
    typeof payload.timezone === "string"
      ? payload.timezone.trim()
      : "";

  if (!timezone || !isValidTimezone(timezone)) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Please provide a valid school timezone.",
      },
      { status: 400 }
    );
  }

  const weekdayFields = [
    ["mondayEnabled", "Monday"],
    ["tuesdayEnabled", "Tuesday"],
    ["wednesdayEnabled", "Wednesday"],
    ["thursdayEnabled", "Thursday"],
    ["fridayEnabled", "Friday"],
    ["saturdayEnabled", "Saturday"],
    ["sundayEnabled", "Sunday"],
  ] as const;

  for (const [field, label] of weekdayFields) {
    if (!isValidBoolean(payload[field])) {
      return NextResponse.json(
        {
          success: false,
          message: `${label} attendance setting must be true or false.`,
        },
        { status: 400 }
      );
    }
  }

  try {
    const existingResult = await pool.query(
      `
        SELECT
          latitude,
          longitude,
          geofence_radius_meters,
          geofence_enabled
        FROM staff_attendance_settings
        WHERE school_id = $1
        LIMIT 1
      `,
      [manager.schoolId]
    );

    const existing = existingResult.rows[0];

    let latitude: number | null =
      existing?.latitude ?? null;

    let longitude: number | null =
      existing?.longitude ?? null;

    let geofenceRadiusMeters: number =
      existing?.geofence_radius_meters ?? 100;

    let geofenceEnabled: boolean =
      existing?.geofence_enabled ?? true;

    if (hasOwn(payload, "latitude")) {
      latitude = normalizeCoordinate(
        payload.latitude,
        "latitude"
      );
    }

    if (hasOwn(payload, "longitude")) {
      longitude = normalizeCoordinate(
        payload.longitude,
        "longitude"
      );
    }

    if (hasOwn(payload, "geofenceRadiusMeters")) {
      if (!isValidRadius(payload.geofenceRadiusMeters)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Geofence radius must be between 20 and 5000 meters.",
          },
          { status: 400 }
        );
      }

      geofenceRadiusMeters =
        payload.geofenceRadiusMeters as number;
    }

    if (hasOwn(payload, "geofenceEnabled")) {
      if (!isValidBoolean(payload.geofenceEnabled)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Geofence enabled must be true or false.",
          },
          { status: 400 }
        );
      }

      geofenceEnabled =
        payload.geofenceEnabled as boolean;
    }

    if (
      geofenceEnabled &&
      ((latitude === null && longitude !== null) ||
        (latitude !== null && longitude === null))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Latitude and longitude must be provided together.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
        INSERT INTO staff_attendance_settings (
          school_id,
          clock_in_time,
          clock_out_time,
          late_grace_minutes,
          timezone,
          monday_enabled,
          tuesday_enabled,
          wednesday_enabled,
          thursday_enabled,
          friday_enabled,
          saturday_enabled,
          sunday_enabled,
          latitude,
          longitude,
          geofence_radius_meters,
          geofence_enabled
        )
        VALUES (
          $1,
          $2::time,
          $3::time,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16
        )
        ON CONFLICT (school_id)
        DO UPDATE SET
          clock_in_time = EXCLUDED.clock_in_time,
          clock_out_time = EXCLUDED.clock_out_time,
          late_grace_minutes = EXCLUDED.late_grace_minutes,
          timezone = EXCLUDED.timezone,
          monday_enabled = EXCLUDED.monday_enabled,
          tuesday_enabled = EXCLUDED.tuesday_enabled,
          wednesday_enabled = EXCLUDED.wednesday_enabled,
          thursday_enabled = EXCLUDED.thursday_enabled,
          friday_enabled = EXCLUDED.friday_enabled,
          saturday_enabled = EXCLUDED.saturday_enabled,
          sunday_enabled = EXCLUDED.sunday_enabled,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          geofence_radius_meters = EXCLUDED.geofence_radius_meters,
          geofence_enabled = EXCLUDED.geofence_enabled,
          updated_at = NOW()
        RETURNING
          clock_in_time,
          clock_out_time,
          late_grace_minutes,
          timezone,
          monday_enabled,
          tuesday_enabled,
          wednesday_enabled,
          thursday_enabled,
          friday_enabled,
          saturday_enabled,
          sunday_enabled,
          latitude,
          longitude,
          geofence_radius_meters,
          geofence_enabled
      `,
      [
        manager.schoolId,
        clockInTime,
        clockOutTime,
        lateGraceMinutes,
        timezone,
        payload.mondayEnabled,
        payload.tuesdayEnabled,
        payload.wednesdayEnabled,
        payload.thursdayEnabled,
        payload.fridayEnabled,
        payload.saturdayEnabled,
        payload.sundayEnabled,
        latitude,
        longitude,
        geofenceRadiusMeters,
        geofenceEnabled,
      ]
    );

    return NextResponse.json({
      success: true,
      message:
        "Staff attendance settings saved successfully.",
      settings: serializeSettings(result.rows[0]),
    });
  } catch (error) {
    console.error(
      "Staff attendance settings PUT error:",
      error
    );

    if (
      error instanceof Error &&
      error.message.includes("Latitude") ||
      error instanceof Error &&
      error.message.includes("Longitude")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save staff attendance settings.",
      },
      { status: 500 }
    );
  }
}
