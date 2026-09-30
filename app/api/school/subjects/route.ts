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
       code
     FROM subjects
     WHERE school_id = $1
     ORDER BY name ASC`,
    [membership.school_id]
  );

  return NextResponse.json({
    success: true,
    subjects: result.rows,
  });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  if (!name || !code) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject name and code are required.",
      },
      { status: 400 }
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject name must be 100 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (code.length > 30) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject code must be 30 characters or fewer.",
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
        message: "Only the school owner can manage subjects.",
      },
      { status: 403 }
    );
  }

  try {
    await pool.query(
      `INSERT INTO subjects (
         school_id,
         name,
         code
       )
       VALUES ($1, $2, $3)`,
      [membership.school_id, name, code]
    );

    return NextResponse.redirect(
      new URL("/dashboard/subjects?created=1", request.url)
    );
  } catch (error) {
    console.error("Subject creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create subject. A subject with this name or code may already exist.",
      },
      { status: 500 }
    );
  }
}
