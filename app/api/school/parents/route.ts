import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
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
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const formData = await request.formData();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!fullName) {
    return NextResponse.json(
      {
        success: false,
        message: "Full name is required.",
      },
      { status: 400 }
    );
  }

  if (fullName.length > 200) {
    return NextResponse.json(
      {
        success: false,
        message: "Full name must be 200 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (email.length > 255) {
    return NextResponse.json(
      {
        success: false,
        message: "Email must be 255 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (phone.length > 30) {
    return NextResponse.json(
      {
        success: false,
        message: "Phone must be 30 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (!["active", "inactive"].includes(status)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid parent status.",
      },
      { status: 400 }
    );
  }

  try {
    await pool.query(
      `INSERT INTO parents (
        school_id,
        full_name,
        email,
        phone,
        address,
        status
      )
      VALUES (
        $1,
        $2,
        NULLIF($3, ''),
        NULLIF($4, ''),
        NULLIF($5, ''),
        $6
      )`,
      [
        membership.school_id,
        fullName,
        email,
        phone,
        address,
        status,
      ]
    );
  } catch (error) {
    console.error("Create parent error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create parent.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/parents?created=1", request.url)
  );
}
