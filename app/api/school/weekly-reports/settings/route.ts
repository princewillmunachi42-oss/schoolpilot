import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS = [
"Monday", "Tuesday", "Wednesday", "Thursday",
"Friday", "Saturday", "Sunday",
];
const ROLES = ["owner", "principal", "admin"];

async function authorizedSchool(request: NextRequest) {
const user = await getCurrentUser();
if (!user) return { error: "Unauthorized", status: 401 as const };

const requestedSchoolId = request.nextUrl.searchParams.get("schoolId");
const result = await pool.query(
"SELECT sm.school_id, sm.role, s.name AS school_name FROM school_members sm JOIN schools s ON s.id = sm.school_id WHERE sm.user_id = $1 AND ($2::uuid IS NULL OR sm.school_id = $2::uuid) AND sm.role IN ('owner','principal','admin') ORDER BY CASE sm.role WHEN 'owner' THEN 1 WHEN 'principal' THEN 2 ELSE 3 END, s.name LIMIT 1",
[user.id, requestedSchoolId || null],
);

if (!result.rows[0]) {
return { error: "You do not have permission to manage weekly reports for this school.", status: 403 as const };
}

return { user, membership: result.rows[0] };
}

export async function GET(request: NextRequest) {
try {
const auth = await authorizedSchool(request);
if ("error" in auth) {
return NextResponse.json({ error: auth.error }, { status: auth.status });
}

const { membership } = auth;
const result = await pool.query(
  `SELECT enabled, report_days, delivery_day,
          to_char(delivery_time, 'HH24:MI') AS delivery_time,
          report_period, recipient_roles, timezone
   FROM school_weekly_report_settings
   WHERE school_id = $1`,
  [membership.school_id],
);

const saved = result.rows[0];
return NextResponse.json({
  schoolId: membership.school_id,
  schoolName: membership.school_name,
  settings: saved ?? {
    enabled: true,
    report_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    delivery_day: "Friday",
    delivery_time: "17:00",
    report_period: "previous_week",
    recipient_roles: ["owner", "principal", "admin"],
    timezone: "Africa/Lagos",
  },
});

} catch (error) {
console.error("Weekly report settings read error:", error);
return NextResponse.json({ error: "Unable to load weekly report settings." }, { status: 500 });
}
}

export async function PUT(request: NextRequest) {
try {
const auth = await authorizedSchool(request);
if ("error" in auth) {
return NextResponse.json({ error: auth.error }, { status: auth.status });
}

const body = await request.json();
const days = body.report_days;
const recipients = body.recipient_roles;
const deliveryDay = body.delivery_day;
const deliveryTime = body.delivery_time;
const period = body.report_period;
const enabled = body.enabled;

if (
  typeof enabled !== "boolean" ||
  !Array.isArray(days) ||
  days.length === 0 ||
  days.some((day: unknown) => typeof day !== "string" || !DAYS.includes(day)) ||
  new Set(days).size !== days.length ||
  typeof deliveryDay !== "string" ||
  !DAYS.includes(deliveryDay) ||
  typeof deliveryTime !== "string" ||
  !/^([01]\d|2[0-3]):[0-5]\d$/.test(deliveryTime) ||
  !["current_week", "previous_week"].includes(period) ||
  !Array.isArray(recipients) ||
  recipients.length === 0 ||
  recipients.some((role: unknown) => typeof role !== "string" || !ROLES.includes(role)) ||
  new Set(recipients).size !== recipients.length
) {
  return NextResponse.json({ error: "Please check your report days, delivery schedule, period and recipients." }, { status: 400 });
}

const { membership } = auth;
const result = await pool.query(
  `INSERT INTO school_weekly_report_settings
    (school_id, enabled, report_days, delivery_day, delivery_time,
     report_period, recipient_roles, updated_at)
   VALUES ($1,$2,$3,$4,$5::time,$6,$7,NOW())
   ON CONFLICT (school_id) DO UPDATE SET
     enabled = EXCLUDED.enabled,
     report_days = EXCLUDED.report_days,
     delivery_day = EXCLUDED.delivery_day,
     delivery_time = EXCLUDED.delivery_time,
     report_period = EXCLUDED.report_period,
     recipient_roles = EXCLUDED.recipient_roles,
     updated_at = NOW()
   RETURNING enabled, report_days, delivery_day,
     to_char(delivery_time, 'HH24:MI') AS delivery_time,
     report_period, recipient_roles, timezone`,
  [
    membership.school_id, enabled, days, deliveryDay,
    deliveryTime, period, recipients,
  ],
);

return NextResponse.json({
  success: true,
  schoolName: membership.school_name,
  settings: result.rows[0],
});

} catch (error) {
console.error("Weekly report settings save error:", error);
return NextResponse.json({ error: "Unable to save weekly report settings." }, { status: 500 });
}
}
