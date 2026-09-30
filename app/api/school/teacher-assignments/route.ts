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

  const assignmentType = String(
    formData.get("assignmentType") ?? ""
  ).trim();

  const staffId = String(formData.get("staffId") ?? "").trim();
  const classId = String(formData.get("classId") ?? "").trim();
  const subjectId = String(formData.get("subjectId") ?? "").trim();

  const isPrimary = formData.get("isPrimary") === "on";

  if (!staffId) {
    return NextResponse.json(
      {
        success: false,
        message: "Teacher is required.",
      },
      { status: 400 }
    );
  }

  if (!["class", "subject"].includes(assignmentType)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid assignment type.",
      },
      { status: 400 }
    );
  }

  try {
    const staffResult = await pool.query(
      `SELECT id
       FROM staff
       WHERE id = $1
         AND school_id = $2
         AND status = 'active'
       LIMIT 1`,
      [staffId, membership.school_id]
    );

    if (staffResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Teacher does not belong to your school.",
        },
        { status: 400 }
      );
    }

    if (assignmentType === "class") {
      if (!classId) {
        return NextResponse.json(
          {
            success: false,
            message: "Class is required.",
          },
          { status: 400 }
        );
      }

      const classResult = await pool.query(
        `SELECT id
         FROM classes
         WHERE id = $1
           AND school_id = $2
         LIMIT 1`,
        [classId, membership.school_id]
      );

      if (classResult.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Class does not belong to your school.",
          },
          { status: 400 }
        );
      }

      if (isPrimary) {
        await pool.query(
          `UPDATE class_teachers
           SET is_primary = false
           WHERE class_id = $1
             AND school_id = $2`,
          [classId, membership.school_id]
        );
      }

      await pool.query(
        `INSERT INTO class_teachers (
          school_id,
          class_id,
          staff_id,
          is_primary
        )
        VALUES ($1, $2, $3, $4)`,
        [
          membership.school_id,
          classId,
          staffId,
          isPrimary,
        ]
      );
    }

    if (assignmentType === "subject") {
      if (!subjectId) {
        return NextResponse.json(
          {
            success: false,
            message: "Subject is required.",
          },
          { status: 400 }
        );
      }

      const subjectResult = await pool.query(
        `SELECT id
         FROM subjects
         WHERE id = $1
           AND school_id = $2
         LIMIT 1`,
        [subjectId, membership.school_id]
      );

      if (subjectResult.rowCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Subject does not belong to your school.",
          },
          { status: 400 }
        );
      }

      if (classId) {
        const classResult = await pool.query(
          `SELECT id
           FROM classes
           WHERE id = $1
             AND school_id = $2
           LIMIT 1`,
          [classId, membership.school_id]
        );

        if (classResult.rowCount === 0) {
          return NextResponse.json(
            {
              success: false,
              message: "Class does not belong to your school.",
            },
            { status: 400 }
          );
        }
      }

      await pool.query(
        `INSERT INTO teacher_subjects (
          school_id,
          staff_id,
          subject_id,
          class_id
        )
        VALUES ($1, $2, $3, NULLIF($4, '')::uuid)`,
        [
          membership.school_id,
          staffId,
          subjectId,
          classId,
        ]
      );
    }
  } catch (error: any) {
    if (error?.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "This teacher assignment already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Teacher assignment error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create teacher assignment.",
      },
      { status: 500 }
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/teacher-assignments?created=1", request.url)
  );
}
