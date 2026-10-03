import { NextRequest, NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth/parent";
import pool from "@/lib/db";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const parent = await getCurrentParent();

  if (!parent) {
    return NextResponse.json(
      {
        success: false,
        message: "Parent account not found.",
      },
      { status: 401 }
    );
  }

  const { studentId } = await context.params;

  if (!studentId) {
    return NextResponse.json(
      {
        success: false,
        message: "Student ID is required.",
      },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `SELECT
       s.id,
       s.first_name,
       s.last_name,
       s.other_name,
       s.admission_number,
       s.gender,
       s.date_of_birth,
       s.class_id,
       c.name AS class_name,
       c.level AS class_level,
       ps.relationship,
       ps.is_primary_contact
     FROM parent_students ps
     INNER JOIN students s
       ON s.id = ps.student_id
      AND s.school_id = ps.school_id
     LEFT JOIN classes c
       ON c.id = s.class_id
      AND c.school_id = s.school_id
     WHERE ps.parent_id = $1
       AND ps.school_id = $2
       AND ps.student_id = $3
       AND s.status = 'active'
     LIMIT 1`,
    [parent.parentId, parent.schoolId, studentId]
  );

  const child = result.rows[0];

  if (!child) {
    return NextResponse.json(
      {
        success: false,
        message: "Child not found or not linked to your account.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    child,
  });
}
