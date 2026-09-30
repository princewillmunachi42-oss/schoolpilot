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
       capacity,
       status
     FROM classes
     WHERE school_id = $1
       AND status = 'active'
     ORDER BY name ASC`,
    [membership.school_id]
  );

  return NextResponse.json({
    success: true,
    classes: result.rows,
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

  const capacityValue = String(
    formData.get("capacity") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "active"
  ).trim();

  if (!academicSessionId || !name) {
    return NextResponse.json(
      {
        success: false,
        message: "Academic session and class name are required.",
      },
      { status: 400 }
    );
  }

  if (status !== "active" && status !== "inactive") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid class status.",
      },
      { status: 400 }
    );
  }

  let capacity: number | null = null;

  if (capacityValue) {
    const parsedCapacity = Number(capacityValue);

    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Capacity must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    capacity = parsedCapacity;
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
        message: "Only the school owner can manage classes.",
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

  try {
    const result = await pool.query(
      `INSERT INTO classes (
         school_id,
         academic_session_id,
         name,
         capacity,
         status
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, capacity, status`,
      [
        membership.school_id,
        academicSessionId,
        name,
        capacity,
        status,
      ]
    );

    return NextResponse.redirect(
      new URL("/dashboard/classes?created=1", request.url)
    );
  } catch (error) {
    console.error("Class creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create class. A class with this name may already exist in this academic session.",
      },
      { status: 500 }
    );
  }
}
