import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const membershipResult = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
       AND role = 'owner'
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        message: "School membership not found.",
      },
      { status: 403 }
    );
  }

  const result = await pool.query(
    `SELECT
       id,
       name,
       academic_session_id,
       start_date,
       end_date,
       is_current
     FROM terms
     WHERE school_id = $1
     ORDER BY start_date ASC`,
    [membership.school_id]
  );

  return NextResponse.json({
    success: true,
    terms: result.rows,
  });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const academicSessionId = String(
    formData.get("academicSessionId") ?? ""
  ).trim();

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const isCurrent = formData.get("isCurrent") === "true";

  if (!academicSessionId || !name || !startDate || !endDate) {
    return NextResponse.json(
      {
        success: false,
        message: "Session, term name, start date and end date are required.",
      },
      { status: 400 }
    );
  }

  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json(
      {
        success: false,
        message: "End date must be after start date.",
      },
      { status: 400 }
    );
  }

  const membershipResult = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can manage terms.",
      },
      { status: 403 }
    );
  }

  const sessionResult = await pool.query(
    `SELECT id
     FROM academic_sessions
     WHERE id = $1
       AND school_id = $2
     LIMIT 1`,
    [academicSessionId, membership.school_id]
  );

  if (!sessionResult.rowCount) {
    return NextResponse.json(
      {
        success: false,
        message: "Academic session not found for this school.",
      },
      { status: 404 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (isCurrent) {
      await client.query(
        `UPDATE terms
         SET is_current = false
         WHERE school_id = $1`,
        [membership.school_id]
      );
    }

    await client.query(
      `INSERT INTO terms (
         school_id,
         academic_session_id,
         name,
         start_date,
         end_date,
         is_current
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        membership.school_id,
        academicSessionId,
        name,
        startDate,
        endDate,
        isCurrent,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.redirect(
      new URL("/dashboard/terms?created=1", request.url)
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Term creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create term.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
