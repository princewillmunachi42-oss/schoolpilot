import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getStaffAttendanceManager } from "@/lib/auth/staff-attendance";

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET(request: NextRequest) {
  const manager = await getStaffAttendanceManager();

  if (!manager) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authorized to manage staff attendance.",
      },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const requestedDate = searchParams.get("date");
  const search = searchParams.get("search")?.trim() || "";

  const attendanceDate =
    requestedDate && isValidDate(requestedDate)
      ? requestedDate
      : new Intl.DateTimeFormat("en-CA", {
          timeZone: "Africa/Lagos",
        }).format(new Date());

  try {
    const settingsResult = await pool.query(
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
          sunday_enabled
        FROM staff_attendance_settings
        WHERE school_id = $1
        LIMIT 1
      `,
      [manager.schoolId]
    );

    const settings = settingsResult.rows[0] ?? {
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
    };

    const result = await pool.query(
      `
        SELECT
          s.id,
          s.staff_id,
          s.first_name,
          s.last_name,
          s.other_name,
          s.email,
          s.phone,
          s.role_title,
          s.photo_url,
          s.status,

          sar.id AS attendance_id,
          sar.clock_in_at,
          sar.clock_out_at,
          sar.status AS attendance_status,
          sar.late_minutes,

          CASE
            WHEN sar.id IS NULL THEN 'not_clocked_in'
            WHEN sar.clock_out_at IS NOT NULL THEN 'completed'
            WHEN sar.clock_in_at IS NOT NULL THEN 'clocked_in'
            ELSE 'not_clocked_in'
          END AS current_state

        FROM staff s

        LEFT JOIN staff_attendance_records sar
          ON sar.school_id = s.school_id
         AND sar.staff_id = s.id
         AND sar.attendance_date = $2

        WHERE s.school_id = $1
          AND s.status = 'active'
          AND (
            $3 = ''
            OR s.staff_id ILIKE '%' || $3 || '%'
            OR s.first_name ILIKE '%' || $3 || '%'
            OR s.last_name ILIKE '%' || $3 || '%'
            OR COALESCE(s.other_name, '') ILIKE '%' || $3 || '%'
            OR COALESCE(s.role_title, '') ILIKE '%' || $3 || '%'
            OR COALESCE(s.email, '') ILIKE '%' || $3 || '%'
          )

        ORDER BY
          CASE
            WHEN sar.status = 'late' THEN 1
            WHEN sar.id IS NOT NULL THEN 2
            ELSE 3
          END,
          s.first_name ASC,
          s.last_name ASC
      `,
      [manager.schoolId, attendanceDate, search]
    );

    const staff = result.rows.map((row) => ({
      id: row.id,
      staffId: row.staff_id,
      firstName: row.first_name,
      lastName: row.last_name,
      otherName: row.other_name,
      fullName: [row.first_name, row.other_name, row.last_name]
        .filter(Boolean)
        .join(" "),
      email: row.email,
      phone: row.phone,
      roleTitle: row.role_title,
      photoUrl: row.photo_url,
      status: row.status,

      attendanceId: row.attendance_id,
      clockInAt: row.clock_in_at,
      clockOutAt: row.clock_out_at,
      attendanceStatus: row.attendance_status,
      lateMinutes: row.late_minutes ?? 0,
      currentState: row.current_state,
    }));

    const summary = {
      totalStaff: staff.length,
      present: staff.filter(
        (member) =>
          member.attendanceStatus === "present" ||
          member.attendanceStatus === "late"
      ).length,
      late: staff.filter(
        (member) => member.attendanceStatus === "late"
      ).length,
      notClockedIn: staff.filter(
        (member) => member.currentState === "not_clocked_in"
      ).length,
      clockedIn: staff.filter(
        (member) =>
          member.currentState === "clocked_in" ||
          member.currentState === "completed"
      ).length,
      completed: staff.filter(
        (member) => member.currentState === "completed"
      ).length,
    };

    return NextResponse.json({
      success: true,
      date: attendanceDate,
      timezone: settings.timezone,
      settings: {
        clockInTime: settings.clock_in_time,
        clockOutTime: settings.clock_out_time,
        lateGraceMinutes: settings.late_grace_minutes,
        timezone: settings.timezone,
        mondayEnabled: settings.monday_enabled,
        tuesdayEnabled: settings.tuesday_enabled,
        wednesdayEnabled: settings.wednesday_enabled,
        thursdayEnabled: settings.thursday_enabled,
        fridayEnabled: settings.friday_enabled,
        saturdayEnabled: settings.saturday_enabled,
        sundayEnabled: settings.sunday_enabled,
      },
      summary,
      staff,
    });
  } catch (error) {
    console.error("Staff attendance monitoring error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load staff attendance.",
      },
      { status: 500 }
    );
  }
}
