import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentTeacher } from "@/lib/auth/teacher";

export async function GET() {
  const teacher = await getCurrentTeacher();

  if (!teacher) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const result = await pool.query(
    `
      SELECT
        a.id,
        a.title,
        a.content,
        a.audience,
        a.published_at,
        a.created_at,
        a.updated_at,
        u.first_name AS created_by_first_name,
        u.last_name AS created_by_last_name
      FROM announcements a
      JOIN users u
        ON u.id = a.created_by
      WHERE a.school_id = $1
        AND a.status = 'published'
        AND (
          a.audience = 'all'
          OR a.audience = 'teachers'
        )
      ORDER BY
        COALESCE(a.published_at, a.created_at) DESC,
        a.created_at DESC
    `,
    [teacher.schoolId]
  );

  return NextResponse.json({
    success: true,
    announcements: result.rows,
  });
}
