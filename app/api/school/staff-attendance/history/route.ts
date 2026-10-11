import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getStaffAttendanceManager } from "@/lib/auth/staff-attendance";

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function getScheduledMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return hour * 60 + minute;
}

function getLocalMinutes(value: Date, timezone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(value);

    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const manager = await getStaffAttendanceManager();

  if (!manager) {
    return NextResponse.json(
      { success: false, message: "You are not authorized to manage staff attendance." },
      { status: 403 }
    );
  }

  const params = request.nextUrl.searchParams;
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const search = (params.get("search") || "").trim();

  if (!isValidDate(from) || !isValidDate(to) || from > to) {
    return NextResponse.json(
      { success: false, message: "Provide a valid date range with the start date before or equal to the end date." },
      { status: 400 }
    );
  }

  const days = Math.floor(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000
  ) + 1;

  if (days > 366) {
    return NextResponse.json(
      { success: false, message: "The report range cannot exceed 366 days." },
      { status: 400 }
    );
  }

  try {
    const settingsResult = await pool.query(
      `SELECT clock_out_time, timezone
       FROM staff_attendance_settings
       WHERE school_id = $1
       LIMIT 1`,
      [manager.schoolId]
    );

    const settings = settingsResult.rows[0] ?? {
      clock_out_time: null,
      timezone: "Africa/Lagos",
    };
    const timezone = settings.timezone || "Africa/Lagos";
    const scheduledClockOut = getScheduledMinutes(settings.clock_out_time);

    const result = await pool.query(
      `SELECT
         sar.id AS attendance_id,
         sar.attendance_date,
         sar.staff_id,
         s.first_name,
         s.last_name,
         s.other_name,
         s.role_title,
         sar.clock_in_at,
         sar.clock_out_at,
         sar.status AS attendance_status,
         sar.late_minutes
       FROM staff_attendance_records sar
       INNER JOIN staff s
         ON s.id = sar.staff_id
        AND s.school_id = sar.school_id
       WHERE sar.school_id = $1
         AND sar.attendance_date >= $2::date
         AND sar.attendance_date <= $3::date
         AND (
           $4 = ''
           OR s.staff_id ILIKE '%' || $4 || '%'
           OR s.first_name ILIKE '%' || $4 || '%'
           OR s.last_name ILIKE '%' || $4 || '%'
           OR COALESCE(s.other_name, '') ILIKE '%' || $4 || '%'
           OR COALESCE(s.role_title, '') ILIKE '%' || $4 || '%'
         )
       ORDER BY sar.attendance_date DESC, s.first_name ASC, s.last_name ASC`,
      [manager.schoolId, from, to, search]
    );

    const records = result.rows.map((row) => {
      const clockInAt = row.clock_in_at ? new Date(row.clock_in_at) : null;
      const clockOutAt = row.clock_out_at ? new Date(row.clock_out_at) : null;
      const actualClockOut = clockOutAt
        ? getLocalMinutes(clockOutAt, timezone)
        : null;

      const earlyDepartureMinutes =
        actualClockOut !== null &&
        scheduledClockOut !== null &&
        actualClockOut < scheduledClockOut
          ? scheduledClockOut - actualClockOut
          : 0;

      const hoursWorkedMinutes =
        clockInAt && clockOutAt
          ? Math.max(
              0,
              Math.floor((clockOutAt.getTime() - clockInAt.getTime()) / 60000)
            )
          : null;

      return {
        attendanceId: row.attendance_id,
        date: row.attendance_date instanceof Date
          ? row.attendance_date.toISOString().slice(0, 10)
          : String(row.attendance_date).slice(0, 10),
        staffId: row.staff_id,
        staffName: [row.first_name, row.other_name, row.last_name]
          .filter(Boolean)
          .join(" "),
        roleTitle: row.role_title,
        clockInAt: row.clock_in_at,
        clockOutAt: row.clock_out_at,
        attendanceStatus: row.attendance_status,
        lateMinutes: row.late_minutes ?? 0,
        earlyDepartureMinutes,
        departedEarly: earlyDepartureMinutes > 0,
        hoursWorkedMinutes,
        shiftCompleted: clockInAt !== null && clockOutAt !== null,
      };
    });

    return NextResponse.json({
      success: true,
      from,
      to,
      timezone,
      summary: {
        recordedEntries: records.length,
        lateArrivals: records.filter((record) => record.attendanceStatus === "late").length,
        earlyDepartures: records.filter((record) => record.departedEarly).length,
        incompleteShifts: records.filter((record) => !record.shiftCompleted).length,
        totalCompletedHoursMinutes: records.reduce(
          (total, record) => total + (record.hoursWorkedMinutes ?? 0),
          0
        ),
      },
      records,
    });
  } catch (error) {
    console.error("Staff attendance history error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to load staff attendance history." },
      { status: 500 }
    );
  }
}
