import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  const membershipResult = await pool.query(
    `
      SELECT school_id, role
      FROM school_members
      WHERE user_id = $1
        AND role = 'owner'
      LIMIT 1
    `,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership) {
    return NextResponse.json(
      { message: "Forbidden." },
      { status: 403 }
    );
  }

  const { id } = await params;
  const type = request.nextUrl.searchParams.get("type");

  if (!type || !["class", "subject"].includes(type)) {
    return NextResponse.json(
      { message: "Invalid assignment type." },
      { status: 400 }
    );
  }

  if (type === "class") {
    const result = await pool.query(
      `
        SELECT
          ct.id,
          ct.staff_id,
          ct.class_id,
          ct.is_primary,
          st.first_name,
          st.last_name,
          st.staff_id AS staff_code,
          c.name AS class_name
        FROM class_teachers ct
        JOIN staff st ON st.id = ct.staff_id
        JOIN classes c ON c.id = ct.class_id
        WHERE ct.id = $1
          AND ct.school_id = $2
        LIMIT 1
      `,
      [id, membership.school_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Assignment not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      assignmentType: "class",
      assignment: result.rows[0],
    });
  }

  const result = await pool.query(
    `
      SELECT
        ts.id,
        ts.staff_id,
        ts.subject_id,
        ts.class_id,
        st.first_name,
        st.last_name,
        st.staff_id AS staff_code,
        sub.name AS subject_name,
        sub.code AS subject_code,
        c.name AS class_name
      FROM teacher_subjects ts
      JOIN staff st ON st.id = ts.staff_id
      JOIN subjects sub ON sub.id = ts.subject_id
      LEFT JOIN classes c ON c.id = ts.class_id
      WHERE ts.id = $1
        AND ts.school_id = $2
      LIMIT 1
    `,
    [id, membership.school_id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { message: "Assignment not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    assignmentType: "subject",
    assignment: result.rows[0],
  });
}
