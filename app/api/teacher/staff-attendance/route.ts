import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getCurrentStaffAttendanceUser } from "@/lib/auth/staff-attendance";

type AttendanceAction = "clock_in" | "clock_out";

const WEEKDAY_COLUMNS: Record<
  string,
  keyof {
    monday_enabled: boolean;
    tuesday_enabled: boolean;
    wednesday_enabled: boolean;
    thursday_enabled: boolean;
    friday_enabled: boolean;
    saturday_enabled: boolean;
    sunday_enabled: boolean;
  }
> = {
  Monday: "monday_enabled",
  Tuesday: "tuesday_enabled",
  Wednesday: "wednesday_enabled",
  Thursday: "thursday_enabled",
  Friday: "friday_enabled",
  Saturday: "saturday_enabled",
  Sunday: "sunday_enabled",
};

const EARTH_RADIUS_METERS = 6_371_000;

function getSchoolLocalDateTime(timezone: string) {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "long",
  });

  const parts = formatter.formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
    weekday: values.weekday,
  };
}

function calculateLateMinutes(
  hour: number,
  minute: number,
  scheduledTime: string | null,
  graceMinutes: number
) {
  if (!scheduledTime) {
    return 0;
  }

  const [scheduledHour, scheduledMinute] = scheduledTime
    .slice(0, 5)
    .split(":")
    .map(Number);

  const scheduledTotal = scheduledHour * 60 + scheduledMinute;
  const actualTotal = hour * 60 + minute;
  const lateThreshold = scheduledTotal + graceMinutes;

  if (actualTotal <= lateThreshold) {
    return 0;
  }

  return actualTotal - scheduledTotal;
}

function isValidLatitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

function isValidLongitude(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

function isValidAccuracy(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 10_000
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function calculateDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const lat1 = toRadians(latitude1);
  const lat2 = toRadians(latitude2);
  const deltaLat = toRadians(latitude2 - latitude1);
  const deltaLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLongitude / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

async function insertEvent(
  client: {
    query: (text: string, values?: unknown[]) => Promise<unknown>;
  },
  values: {
    schoolId: string;
    staffId: string;
    stationId?: string | null;
    eventType:
      | "clock_in"
      | "clock_out"
      | "duplicate_clock_in"
      | "duplicate_clock_out"
      | "geofence_denied"
      | "unauthorized";
    userAgent: string | null;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    distance?: number | null;
  }
) {
  await client.query(
    `
      INSERT INTO staff_attendance_events (
        school_id,
        staff_id,
        station_id,
        event_type,
        latitude,
        longitude,
        accuracy_meters,
        distance_meters,
        user_agent
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9
      )
    `,
    [
      values.schoolId,
      values.staffId,
      values.stationId ?? null,
      values.eventType,
      values.latitude ?? null,
      values.longitude ?? null,
      values.accuracy ?? null,
      values.distance ?? null,
      values.userAgent,
    ]
  );
}

export async function POST(request: NextRequest) {
  const staffUser = await getCurrentStaffAttendanceUser();

  if (!staffUser) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authorized to use staff attendance.",
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

  const stationToken =
    typeof payload.stationToken === "string"
      ? payload.stationToken.trim()
      : "";

  const action =
    typeof payload.action === "string" ? payload.action : "";

  const latitude =
    typeof payload.latitude === "number"
      ? payload.latitude
      : NaN;

  const longitude =
    typeof payload.longitude === "number"
      ? payload.longitude
      : NaN;

  const accuracy =
    typeof payload.accuracy === "number"
      ? payload.accuracy
      : NaN;

  if (!stationToken) {
    return NextResponse.json(
      {
        success: false,
        message: "Attendance station QR token is required.",
      },
      { status: 400 }
    );
  }

  if (
    stationToken.length !== 64 ||
    !/^[a-f0-9]+$/i.test(stationToken)
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid attendance station QR code.",
      },
      { status: 400 }
    );
  }

  if (action !== "clock_in" && action !== "clock_out") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid attendance action.",
      },
      { status: 400 }
    );
  }

  if (!isValidLatitude(latitude)) {
    return NextResponse.json(
      {
        success: false,
        message: "A valid location latitude is required.",
      },
      { status: 400 }
    );
  }

  if (!isValidLongitude(longitude)) {
    return NextResponse.json(
      {
        success: false,
        message: "A valid location longitude is required.",
      },
      { status: 400 }
    );
  }

  if (!isValidAccuracy(accuracy)) {
    return NextResponse.json(
      {
        success: false,
        message: "A valid location accuracy value is required.",
      },
      { status: 400 }
    );
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(stationToken)
    .digest("hex");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const stationResult = await client.query(
      `
        SELECT
          id,
          school_id,
          station_name,
          status
        FROM staff_attendance_stations
        WHERE token_hash = $1
        LIMIT 1
        FOR UPDATE
      `,
      [tokenHash]
    );

    const station = stationResult.rows[0];

    if (!station) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message:
            "This attendance QR code is invalid or has been replaced.",
        },
        { status: 400 }
      );
    }

    if (station.school_id !== staffUser.schoolId) {
      await insertEvent(client, {
        schoolId: station.school_id,
        staffId: staffUser.staffId,
        stationId: station.id,
        eventType: "unauthorized",
        userAgent: request.headers.get("user-agent"),
        latitude,
        longitude,
        accuracy,
      });

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: false,
          message: "This attendance QR code belongs to another school.",
        },
        { status: 403 }
      );
    }

    if (station.status !== "active") {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message:
            "This attendance station is currently inactive. Please contact the school administrator.",
        },
        { status: 403 }
      );
    }

    const settingsResult = await client.query(
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
      [staffUser.schoolId]
    );

    const settings =
      settingsResult.rows[0] ?? {
        clock_in_time: null,
        clock_out_time: null,
        late_grace_minutes: 15,
        timezone: "Africa/Lagos",
        monday_enabled: true,
        tuesday_enabled: true,
        wednesday_enabled: true,
        thursday_enabled: true,
        friday_enabled: true,
        saturday_enabled: false,
        sunday_enabled: false,
        latitude: null,
        longitude: null,
        geofence_radius_meters: 100,
        geofence_enabled: true,
      };

    if (settings.geofence_enabled) {
      if (
        settings.latitude === null ||
        settings.longitude === null
      ) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            message:
              "The school has not configured its attendance location yet.",
          },
          { status: 503 }
        );
      }

      const distance = calculateDistanceMeters(
        latitude,
        longitude,
        Number(settings.latitude),
        Number(settings.longitude)
      );

      const radius = Number(
        settings.geofence_radius_meters ?? 100
      );

      if (!Number.isFinite(radius) || radius <= 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            message:
              "The school's attendance geofence is not configured correctly.",
          },
          { status: 503 }
        );
      }

      if (distance > radius) {
        await insertEvent(client, {
          schoolId: staffUser.schoolId,
          staffId: staffUser.staffId,
          stationId: station.id,
          eventType: "geofence_denied",
          userAgent: request.headers.get("user-agent"),
          latitude,
          longitude,
          accuracy,
          distance,
        });

        await client.query("COMMIT");

        return NextResponse.json(
          {
            success: false,
            message: `You are approximately ${Math.round(
              distance
            )}m from the permitted attendance area. Move closer to the school and try again.`,
            distanceMeters: Math.round(distance),
            allowedRadiusMeters: radius,
          },
          { status: 403 }
        );
      }
    }

    let localTime;

    try {
      localTime = getSchoolLocalDateTime(settings.timezone);
    } catch {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "The school's attendance timezone is invalid.",
        },
        { status: 500 }
      );
    }

    const weekdayColumn = WEEKDAY_COLUMNS[localTime.weekday];

    if (!weekdayColumn || !settings[weekdayColumn]) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Staff attendance is not enabled for today.",
        },
        { status: 403 }
      );
    }

    const existingResult = await client.query(
      `
        SELECT
          id,
          attendance_date,
          clock_in_at,
          clock_out_at,
          status,
          late_minutes
        FROM staff_attendance_records
        WHERE school_id = $1
          AND staff_id = $2
          AND attendance_date = $3::date
        LIMIT 1
        FOR UPDATE
      `,
      [staffUser.schoolId, staffUser.staffId, localTime.date]
    );

    const existing = existingResult.rows[0];

    if (action === "clock_in") {
      if (existing?.clock_in_at) {
        await insertEvent(client, {
          schoolId: staffUser.schoolId,
          staffId: staffUser.staffId,
          stationId: station.id,
          eventType: "duplicate_clock_in",
          userAgent: request.headers.get("user-agent"),
          latitude,
          longitude,
          accuracy,
        });

        await client.query("COMMIT");

        return NextResponse.json(
          {
            success: false,
            message: "You have already clocked in today.",
            attendance: existing,
          },
          { status: 409 }
        );
      }

      const lateMinutes = calculateLateMinutes(
        localTime.hour,
        localTime.minute,
        settings.clock_in_time,
        Number(settings.late_grace_minutes ?? 15)
      );

      const status = lateMinutes > 0 ? "late" : "present";

      const attendanceResult = await client.query(
        `
          INSERT INTO staff_attendance_records (
            school_id,
            staff_id,
            attendance_date,
            clock_in_at,
            status,
            late_minutes,
            clock_in_station_id
          )
          VALUES (
            $1,
            $2,
            $3::date,
            NOW(),
            $4,
            $5,
            $6
          )
          RETURNING
            id,
            attendance_date,
            clock_in_at,
            clock_out_at,
            status,
            late_minutes
        `,
        [
          staffUser.schoolId,
          staffUser.staffId,
          localTime.date,
          status,
          lateMinutes,
          station.id,
        ]
      );

      const attendance = attendanceResult.rows[0];

      await insertEvent(client, {
        schoolId: staffUser.schoolId,
        staffId: staffUser.staffId,
        stationId: station.id,
        eventType: "clock_in",
        userAgent: request.headers.get("user-agent"),
        latitude,
        longitude,
        accuracy,
      });

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        action: "clock_in",
        message:
          lateMinutes > 0
            ? `Clock-in recorded. You arrived ${lateMinutes} minutes late.`
            : "Clock-in recorded successfully.",
        attendance,
      });
    }

    if (!existing?.clock_in_at) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "You must clock in before you can clock out.",
        },
        { status: 409 }
      );
    }

    if (existing.clock_out_at) {
      await insertEvent(client, {
        schoolId: staffUser.schoolId,
        staffId: staffUser.staffId,
        stationId: station.id,
        eventType: "duplicate_clock_out",
        userAgent: request.headers.get("user-agent"),
        latitude,
        longitude,
        accuracy,
      });

      await client.query("COMMIT");

      return NextResponse.json(
        {
          success: false,
          message: "You have already clocked out today.",
          attendance: existing,
        },
        { status: 409 }
      );
    }

    const clockOutResult = await client.query(
      `
        UPDATE staff_attendance_records
        SET
          clock_out_at = NOW(),
          clock_out_station_id = $1,
          updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
          AND staff_id = $4
          AND clock_out_at IS NULL
        RETURNING
          id,
          attendance_date,
          clock_in_at,
          clock_out_at,
          status,
          late_minutes
      `,
      [
        station.id,
        existing.id,
        staffUser.schoolId,
        staffUser.staffId,
      ]
    );

    if (!clockOutResult.rows[0]) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Unable to record clock-out. Please try again.",
        },
        { status: 409 }
      );
    }

    const attendance = clockOutResult.rows[0];

    await insertEvent(client, {
      schoolId: staffUser.schoolId,
      staffId: staffUser.staffId,
      stationId: station.id,
      eventType: "clock_out",
      userAgent: request.headers.get("user-agent"),
      latitude,
      longitude,
      accuracy,
    });

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      action: "clock_out",
      message: "Clock-out recorded successfully.",
      attendance,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Staff attendance clock action error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to record staff attendance.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
