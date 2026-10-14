import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validDate(value: string | null): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const schoolId = params.get("schoolId");
    const startDate = params.get("start");
    const endDate = params.get("end");
    const weekdays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    const requestedDays = params.get("days");
    const reportDays = requestedDays
      ? requestedDays.split(",").filter((day) => weekdays.includes(day))
      : weekdays;
    if (
      requestedDays &&
      (reportDays.length === 0 ||
        reportDays.length !== requestedDays.split(",").length)
    ) {
      return NextResponse.json(
        { error: "Invalid reporting days." },
        { status: 400 },
      );
    }
    const reportDayNumbers = reportDays.map((day) => weekdays.indexOf(day) + 1);

    if (
      !schoolId ||
      !UUID_PATTERN.test(schoolId) ||
      !validDate(startDate) ||
      !validDate(endDate) ||
      startDate > endDate
    ) {
      return NextResponse.json(
        { error: "A valid school and date range are required." },
        { status: 400 },
      );
    }

    const access = await pool.query(
      `SELECT s.id, s.name
       FROM school_members sm
       JOIN schools s ON s.id = sm.school_id
       WHERE sm.user_id = $1
         AND sm.school_id::text = $2
         AND sm.role IN ('owner', 'principal', 'admin')
       LIMIT 1`,
      [user.id, schoolId],
    );

    if (!access.rows[0]) {
      return NextResponse.json(
        { error: "You do not have permission to access this report." },
        { status: 403 },
      );
    }

    const result = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM students
          WHERE school_id = $1 AND status = 'active') AS active_students,
         (SELECT COUNT(*)::int FROM staff
          WHERE school_id = $1) AS staff_count,
         (SELECT COUNT(*)::int FROM classes
          WHERE school_id = $1) AS class_count,
         (SELECT COUNT(*)::int FROM attendance_records
          WHERE school_id = $1
            AND attendance_date BETWEEN $2::date AND $3::date
            AND EXTRACT(ISODOW FROM attendance_date)::int = ANY($4::int[])) AS attendance_records,
         (SELECT COUNT(*)::int FROM attendance_records
          WHERE school_id = $1
            AND attendance_date BETWEEN $2::date AND $3::date
            AND EXTRACT(ISODOW FROM attendance_date)::int = ANY($4::int[])
            AND LOWER(status) = 'present') AS present_count,
         (SELECT COUNT(*)::int FROM attendance_records
          WHERE school_id = $1
            AND attendance_date BETWEEN $2::date AND $3::date
            AND EXTRACT(ISODOW FROM attendance_date)::int = ANY($4::int[])
            AND LOWER(status) = 'absent') AS absent_count,
         (SELECT COUNT(*)::int FROM attendance_records
          WHERE school_id = $1
            AND attendance_date BETWEEN $2::date AND $3::date
            AND EXTRACT(ISODOW FROM attendance_date)::int = ANY($4::int[])
            AND LOWER(status) = 'late') AS late_count,
         (SELECT COUNT(*)::int FROM results
          WHERE school_id = $1
            AND created_at >= $2::date
            AND created_at < ($3::date + INTERVAL '1 day')) AS results_recorded,
         (SELECT ROUND(AVG(total_score)::numeric, 1) FROM results
          WHERE school_id = $1
            AND created_at >= $2::date
            AND created_at < ($3::date + INTERVAL '1 day')) AS average_score,
         (SELECT COUNT(*)::int FROM results
          WHERE school_id = $1
            AND created_at >= $2::date
            AND created_at < ($3::date + INTERVAL '1 day')
            AND total_score >= 50) AS passing_results,
         (SELECT COUNT(*)::int FROM assignments
          WHERE school_id = $1 AND status = 'published'
            AND due_date BETWEEN $2::date AND $3::date) AS assignments_due,
         (SELECT COUNT(*)::int FROM student_report_cards
          WHERE school_id = $1 AND status = 'published'
            AND published_at >= $2::date
            AND published_at < ($3::date + INTERVAL '1 day')) AS reports_published`,
      [schoolId, startDate, endDate, reportDayNumbers],
    );

    const r = result.rows[0];
    const n = (value: unknown) => Number(value ?? 0);
    const attendance = n(r.attendance_records);
    const present = n(r.present_count);
    const late = n(r.late_count);
    const results = n(r.results_recorded);

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 52, bottom: 48, left: 48, right: 48 },
      info: {
        Title: `Weekly School Report - ${access.rows[0].name}`,
        Author: "SchoolPilot",
        Subject: `${startDate} to ${endDate}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));

    const completed = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    doc.fontSize(22).fillColor("#173B70").text("SchoolPilot");
    doc.moveDown(0.3);
    doc.fontSize(17).fillColor("#172033").text("Weekly School Report");
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor("#475569").text(access.rows[0].name);
    doc.fontSize(10).text(`Reporting period: ${startDate} to ${endDate}`);
    doc.moveDown(1);
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor("#CBD5E1").stroke();
    doc.moveDown(1);

    function section(title: string) {
      doc.fontSize(13).fillColor("#173B70").text(title);
      doc.moveDown(0.4);
    }

    function row(label: string, value: string | number) {
      const y = doc.y;
      doc.fontSize(10).fillColor("#334155").text(label, 48, y, {
        width: 365,
      });
      doc
        .fontSize(10)
        .fillColor("#0F172A")
        .text(String(value), 415, y, { width: 130, align: "right" });
      doc.moveDown(0.45);
    }

    section("School Overview");
    row("Active students", n(r.active_students));
    row("Staff members", n(r.staff_count));
    row("Classes", n(r.class_count));
    doc.moveDown(0.6);

    section("Attendance");
    row("Attendance records", attendance);
    row("Present", present);
    row("Absent", n(r.absent_count));
    row("Late", late);
    row(
      "Attendance rate (present + late)",
      attendance
        ? `${Math.round(((present + late) / attendance) * 100)}%`
        : "0%",
    );
    doc.moveDown(0.6);

    section("Academic Activity");
    row("Results recorded during period", results);
    row(
      "Average recorded score",
      r.average_score === null ? "N/A" : `${n(r.average_score)}%`,
    );
    row(
      "Pass rate (scores of 50 or above)",
      results ? `${Math.round((n(r.passing_results) / results) * 100)}%` : "0%",
    );
    row("Published assignments due", n(r.assignments_due));
    row("Report cards published", n(r.reports_published));

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor("#64748B")
      .text(
        "Generated by SchoolPilot. Figures reflect records available when this PDF was created.",
      );
    doc.end();

    const pdf = await completed;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="schoolpilot-weekly-report-${startDate}-${endDate}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Weekly report PDF error:", error);
    return NextResponse.json(
      { error: "Unable to generate the weekly report PDF." },
      { status: 500 },
    );
  }
}
