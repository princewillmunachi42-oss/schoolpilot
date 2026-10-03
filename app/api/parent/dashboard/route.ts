import { NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth/parent";
import pool from "@/lib/db";

export async function GET() {
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

  const result = await pool.query(
    `SELECT
       s.id,
       s.first_name,
       s.last_name,
       s.other_name,
       s.admission_number,
       s.class_id,
       c.name AS class_name,
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
       AND s.status = 'active'
     ORDER BY s.first_name, s.last_name`,
    [parent.parentId, parent.schoolId]
  );

  return NextResponse.json({
    success: true,
    parent: {
      id: parent.parentId,
      fullName: parent.parent.full_name,
      email: parent.parent.email,
      phone: parent.parent.phone,
    },
    children: result.rows,
  });
}
