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
       start_date,
       end_date,
       is_current
     FROM academic_sessions
     WHERE school_id = $1
     ORDER BY start_date DESC`,
    [membership.school_id]
  );

  return NextResponse.json({
    success: true,
    sessions: result.rows,
  });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();
  const isCurrent = formData.get("isCurrent") === "true";

  if (!name || !startDate || !endDate) {
    return NextResponse.json(
      {
        success: false,
        message: "Session name, start date and end date are required.",
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
        message: "Only the school owner can manage academic sessions.",
      },
      { status: 403 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (isCurrent) {
      await client.query(
        `UPDATE academic_sessions
         SET is_current = false
         WHERE school_id = $1`,
        [membership.school_id]
      );
    }

    await client.query(
      `INSERT INTO academic_sessions (
         school_id,
         name,
         start_date,
         end_date,
         is_current
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        membership.school_id,
        name,
        startDate,
        endDate,
        isCurrent,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.redirect(
      new URL("/dashboard/sessions?created=1", request.url)
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Academic session creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create academic session.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  const membershipResult = await pool.query(
    `SELECT school_id, role
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
        message: "Only the school owner can manage academic sessions.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const id = String(body.id ?? "").trim();
  const name = String(body.name ?? "").trim();
  const startDate = String(body.startDate ?? "").trim();
  const endDate = String(body.endDate ?? "").trim();
  const isCurrent = Boolean(body.isCurrent);

  if (!id || !name || !startDate || !endDate) {
    return NextResponse.json(
      {
        success: false,
        message: "Session ID, name, start date and end date are required.",
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

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `SELECT id
       FROM academic_sessions
       WHERE id = $1
         AND school_id = $2
       LIMIT 1`,
      [id, membership.school_id]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Academic session not found.",
        },
        { status: 404 }
      );
    }

    if (isCurrent) {
      await client.query(
        `UPDATE academic_sessions
         SET is_current = false
         WHERE school_id = $1`,
        [membership.school_id]
      );
    }

    await client.query(
      `UPDATE academic_sessions
       SET
         name = $1,
         start_date = $2,
         end_date = $3,
         is_current = $4
       WHERE id = $5
         AND school_id = $6`,
      [
        name,
        startDate,
        endDate,
        isCurrent,
        id,
        membership.school_id,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Academic session updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Academic session update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update academic session.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
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
        message: "Only the school owner can manage academic sessions.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Session ID is required.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `DELETE FROM academic_sessions
       WHERE id = $1
         AND school_id = $2
       RETURNING id`,
      [id, membership.school_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Academic session not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Academic session deleted successfully.",
    });
    } catch (error) {
    console.error("Academic session deletion failed.");

    return NextResponse.json(
      {
        success: false,
        message:
          "This academic session cannot be deleted because it is already being used by terms, classes, timetable entries, attendance, results, or student fees. Remove those records first if you want to delete the session.",
      },
      { status: 409 }
    );
  }

 }
