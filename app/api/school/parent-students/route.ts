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

  const parentId = String(formData.get("parentId") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const relationship = String(
    formData.get("relationship") ?? ""
  ).trim();
  const isPrimaryContact =
    formData.get("isPrimaryContact") === "on";

  if (!parentId || !studentId) {
    return NextResponse.json(
      {
        success: false,
        message: "Parent and student are required.",
      },
      { status: 400 }
    );
  }

  if (relationship.length > 50) {
    return NextResponse.json(
      {
        success: false,
        message: "Relationship must be 50 characters or fewer.",
      },
      { status: 400 }
    );
  }

  try {
    const recordsResult = await pool.query(
      `SELECT
         p.id AS parent_id,
         s.id AS student_id
       FROM parents p
       CROSS JOIN students s
       WHERE p.id = $1
         AND s.id = $2
         AND p.school_id = $3
         AND s.school_id = $3
       LIMIT 1`,
      [parentId, studentId, membership.school_id]
    );

    if (recordsResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent and student must belong to your school.",
        },
        { status: 400 }
      );
    }

    if (isPrimaryContact) {
      await pool.query(
        `UPDATE parent_students
         SET is_primary_contact = false
         WHERE student_id = $1
           AND school_id = $2`,
        [studentId, membership.school_id]
      );
    }

    await pool.query(
      `INSERT INTO parent_students (
        school_id,
        parent_id,
        student_id,
        relationship,
        is_primary_contact
      )
      VALUES ($1, $2, $3, NULLIF($4, ''), $5)`,
      [
        membership.school_id,
        parentId,
        studentId,
        relationship,
        isPrimaryContact,
      ]
    );
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "This parent is already linked to this student.",
        },
        { status: 409 }
      );
    }

    console.error("Link parent to student error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to link parent to student.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/parents?linked=1", request.url)
  );
}
