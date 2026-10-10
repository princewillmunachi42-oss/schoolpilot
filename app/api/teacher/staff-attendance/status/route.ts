import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentStaffAttendanceUser } from "@/lib/auth/staff-attendance";

function formatLocalDate(
  date: Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    ...options,
  }).format(date);
}

export async function GET(request: NextRequest) {
  const staffUser = await getCurrentStaffAttendanceUser(request);

  if (!staffUser) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authorized to view staff attendance.",
      },
      { status: 403 }
    );
  }

  try {
    const settingsResult = await pool.query(
      `
        SELECT
          timezone,
          clock_in_time,
          clock_out_time,
          late_grace_minutes
        FROM staff_attendance_settings
        WHERE school_id = $1
        LIMIT 1
      `,
      [staffUser.schoolId]
    );

    const settings = settingsResult.rows[0] ?? {
      timezone: "Africa/Lagos",
      clock_in_time: null,
      clock_out_time: null,
      late_grace_minutes: 15,
    };

    let timezone = settings.timezone || "Africa/Lagos";

    try {
      new Intl.DateTimeFormat("en-GB", {
        timeZone: timezone,
      }).format(new Date());
    } catch {
      timezone = "Africa/Lagos";
    }

    const today = formatLocalDate(new Date(), timezone, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).split("/").reverse().join("-");

    const todayResult = await pool.query(
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
      `,
      [staffUser.schoolId, staffUser.staffId, today]
    );

    const historyResult = await pool.query(
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
        ORDER BY attendance_date DESC
        LIMIT 60
      `,
      [staffUser.schoolId, staffUser.staffId]
    );

    const summaryResult = await pool.query(
      `
        SELECT
          COUNT(*)::int AS total_days,
          COUNT(*) FILTER (
            WHERE status = 'present'
          )::int AS present_days,
          COUNT(*) FILTER (
            WHERE status = 'late'
          )::int AS late_days,
          COALESCE(
            SUM(late_minutes),
            0
          )::int AS total_late_minutes,
          COUNT(*) FILTER (
            WHERE clock_out_at IS NOT NULL
          )::int AS completed_days
        FROM staff_attendance_records
        WHERE school_id = $1
          AND staff_id = $2
      `,
      [staffUser.schoolId, staffUser.staffId]
    );

    const todayAttendance = todayResult.rows[0] ?? null;
    const summary = summaryResult.rows[0];

    return NextResponse.json({
      success: true,
      staff: {
        id: staffUser.staffId,
        staffNumber: staffUser.staffNumber,
        firstName: staffUser.staff.first_name,
        lastName: staffUser.staff.last_name,
        otherName: staffUser.staff.other_name,
        roleTitle: staffUser.staff.role_title,
        photoUrl: staffUser.staff.photo_url,
      },
      settings: {
        timezone,
        clockInTime: settings.clock_in_time,
        clockOutTime: settings.clock_out_time,
        lateGraceMinutes: Number(settings.late_grace_minutes ?? 15),
      },
      today: todayAttendance ? { ...todayAttendance, clockInAt: todayAttendance.clock_in_at, clockOutAt: todayAttendance.clock_out_at } : null,
      history: historyResult.rows,
      summary: {
        totalDays: Number(summary.total_days ?? 0),
        presentDays: Number(summary.present_days ?? 0),
        lateDays: Number(summary.late_days ?? 0),
        totalLateMinutes: Number(summary.total_late_minutes ?? 0),
        completedDays: Number(summary.completed_days ?? 0),
      },
    });
  } catch (error) {
    console.error("Staff attendance status error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load your staff attendance.",
      },
      { status: 500 }
    );
  }
}
