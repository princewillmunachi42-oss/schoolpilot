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

  const admissionNumber = String(
    formData.get("admissionNumber") ?? ""
  )
    .trim()
    .toUpperCase();

  const classId = String(formData.get("classId") ?? "").trim();
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const otherName = String(formData.get("otherName") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!admissionNumber || !classId || !firstName || !lastName) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Admission number, class, first name, and last name are required.",
      },
      { status: 400 }
    );
  }

  if (admissionNumber.length > 50) {
    return NextResponse.json(
      {
        success: false,
        message: "Admission number must be 50 characters or fewer.",
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

  if (otherName.length > 100) {
    return NextResponse.json(
      {
        success: false,
        message: "Other name must be 100 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (!["", "male", "female", "other"].includes(gender)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid gender.",
      },
      { status: 400 }
    );
  }

  if (!["active", "inactive", "graduated", "withdrawn"].includes(status)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid student status.",
      },
      { status: 400 }
    );
  }

  const classResult = await pool.query(
    `SELECT id
     FROM classes
     WHERE id = $1
       AND school_id = $2
       AND status = 'active'
     LIMIT 1`,
    [classId, membership.school_id]
  );

  if (classResult.rowCount === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Selected class does not belong to your school.",
      },
      { status: 400 }
    );
  }

  try {
    await pool.query(
      `INSERT INTO students (
        school_id,
        class_id,
        admission_number,
        first_name,
        last_name,
        other_name,
        gender,
        date_of_birth,
        email,
        phone,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        NULLIF($6, ''),
        NULLIF($7, ''),
        NULLIF($8, '')::date,
        NULLIF($9, ''),
        NULLIF($10, ''),
        $11
      )`,
      [
        membership.school_id,
        classId,
        admissionNumber,
        firstName,
        lastName,
        otherName,
        gender,
        dateOfBirth,
        email,
        phone,
        status,
      ]
    );
  } catch (error: unknown) {
    const pgError = error as { code?: string };

    if (pgError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "That admission number already exists in this school.",
        },
        { status: 409 }
      );
    }

    console.error("Create student error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create student.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/students?created=1", request.url)
  );
}
