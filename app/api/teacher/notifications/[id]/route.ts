import { NextResponse } from "next/server";
import { getCurrentTeacher } from "@/lib/auth/teacher";
import pool from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacher = await getCurrentTeacher();

  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await pool.query(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
        AND school_id = $2
        AND user_id = $3
    `,
    [id, teacher.schoolId, teacher.userId]
  );

  return NextResponse.json({ success: true });
}
