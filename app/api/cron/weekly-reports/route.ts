import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function localParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    day: get("weekday"),
    time: `${get("hour")}:${get("minute")}`,
  };
}

function weekRange(localDate: string, period: string) {
  const [year, month, day] = localDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;

  date.setUTCDate(
    date.getUTCDate() - daysSinceMonday + (period === "previous_week" ? -7 : 0),
  );

  const start = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() + 6);
  return { start, end: date.toISOString().slice(0, 10) };
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!secret || !authorization || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";

  try {
    const result = await pool.query(
      `SELECT school_id, report_days, delivery_day,
              to_char(delivery_time, 'HH24:MI') AS delivery_time,
              report_period, recipient_roles, timezone
       FROM school_weekly_report_settings
       WHERE enabled = TRUE`,
    );

    const now = new Date();
    let due = 0;
    let inserted = 0;
    let skipped = 0;
    let wouldCreate = 0;

    for (const setting of result.rows) {
      try {
        const timezone = setting.timezone || "Africa/Lagos";
        const local = localParts(now, timezone);

        if (
          local.day !== setting.delivery_day ||
          local.time < setting.delivery_time
        ) {
          skipped++;
          continue;
        }

        const { start, end } = weekRange(local.date, setting.report_period);

        const schoolResult = await pool.query(
          "SELECT name FROM schools WHERE id = $1",
          [setting.school_id],
        );

        if (!schoolResult.rows[0]) {
          skipped++;
          continue;
        }

        const recipients = await pool.query(
          `SELECT sm.user_id
           FROM school_members sm
           JOIN users u ON u.id = sm.user_id
           WHERE sm.school_id = $1
             AND sm.role = ANY($2::text[])
             AND u.status = 'active'`,
          [setting.school_id, setting.recipient_roles],
        );

        const link =
          `/api/school/weekly-reports/pdf?schoolId=${encodeURIComponent(setting.school_id)}` +
          `&start=${start}&end=${end}&days=${encodeURIComponent((setting.report_days || []).join(","))}`;

        const title = "Your weekly school report is ready";
        const message =
          `${schoolResult.rows[0].name}: weekly report for ${start} to ${end}. ` +
          "Open the notification to view or save the PDF.";

        due++;

        if (dryRun) {
          wouldCreate += recipients.rows.length;
          continue;
        }

        for (const recipient of recipients.rows) {
          const saved = await pool.query(
            `INSERT INTO notifications
               (school_id, user_id, title, message, type, link)
             VALUES ($1, $2, $3, $4, 'weekly_report', $5)
             ON CONFLICT (school_id, user_id, link)
             WHERE type = 'weekly_report' AND link IS NOT NULL
             DO NOTHING
             RETURNING id`,
            [setting.school_id, recipient.user_id, title, message, link],
          );

          if (saved.rowCount) inserted++;
        }
      } catch (error) {
        console.error(
          "Weekly report scheduler failed for a school:",
          setting.school_id,
          error,
        );
      }
    }

    return NextResponse.json({
      success: true,
      checked: result.rowCount ?? result.rows.length,
      due,
      dryRun,
      wouldCreate,
      notificationsCreated: inserted,
      skipped,
    });
  } catch (error) {
    console.error("Weekly report cron error:", error);
    return NextResponse.json(
      {
        error: "Unable to process weekly reports.",
        ...(process.env.NODE_ENV === "development"
          ? {
              details:
                error instanceof Error ? error.message : String(error),
            }
          : {}),
      },
      { status: 500 },
    );
  }
}
