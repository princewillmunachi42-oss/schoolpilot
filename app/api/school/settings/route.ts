import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const schoolName = String(formData.get("schoolName") ?? "").trim();
  const schoolEmail = String(formData.get("schoolEmail") ?? "")
    .trim()
    .toLowerCase();

  if (!schoolName || !schoolEmail) {
    return NextResponse.json(
      {
        success: false,
        message: "School name and email are required.",
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

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        message: "School membership not found.",
      },
      { status: 403 }
    );
  }

  if (membership.role !== "owner") {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can change school settings.",
      },
      { status: 403 }
    );
  }

  try {
    await pool.query(
      `UPDATE schools
       SET name = $1,
           email = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [schoolName, schoolEmail, membership.school_id]
    );

    return NextResponse.redirect(
      new URL("/dashboard/settings?saved=1", request.url)
    );
  } catch (error) {
    console.error("School settings update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update school settings.",
      },
      { status: 500 }
    );
  }
}
