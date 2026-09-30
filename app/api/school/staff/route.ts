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
       staff_id,
       first_name,
       last_name,
       other_name,
       role_title,
       status
     FROM staff
     WHERE school_id = $1
       AND status = 'active'
     ORDER BY first_name ASC, last_name ASC`,
    [membership.school_id]
  );

  return NextResponse.json({
    success: true,
    staff: result.rows,
  });
}
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const staffId = String(formData.get("staffId") ?? "")
    .trim()
    .toUpperCase();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const otherName = String(formData.get("otherName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const roleTitle = String(formData.get("roleTitle") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!staffId || !firstName || !lastName) {
    return NextResponse.json(
      {
        success: false,
        message: "Staff ID, first name and last name are required.",
      },
      { status: 400 }
    );
  }

  if (status !== "active" && status !== "inactive") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid staff status.",
      },
      { status: 400 }
    );
  }

  if (staffId.length > 50) {
    return NextResponse.json(
      {
        success: false,
        message: "Staff ID must be 50 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (firstName.length > 100 || lastName.length > 100) {
    return NextResponse.json(
      {
        success: false,
        message: "First name and last name must be 100 characters or fewer.",
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
        message: "Only the school owner can manage staff.",
      },
      { status: 403 }
    );
  }

  try {
    await pool.query(
      `INSERT INTO staff (
         school_id,
         staff_id,
         first_name,
         last_name,
         other_name,
         email,
         phone,
         role_title,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        membership.school_id,
        staffId,
        firstName,
        lastName,
        otherName || null,
        email || null,
        phone || null,
        roleTitle || null,
        status,
      ]
    );

    return NextResponse.redirect(
      new URL("/dashboard/staff?created=1", request.url)
    );
  } catch (error) {
    console.error("Staff creation error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to add staff member. The Staff ID may already exist in this school.",
      },
      { status: 500 }
    );
  }
}
