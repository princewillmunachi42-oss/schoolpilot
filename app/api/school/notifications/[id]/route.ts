import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getStaffAttendanceManager } from "@/lib/auth/staff-attendance";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const manager = await getStaffAttendanceManager();

  if (!manager) {
    return NextResponse.json(
      { success: false, message: "You are not authorized to manage notifications." },
      { status: 403 }
    );
  }

  const { id } = await params;

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid notification ID." },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1
       AND school_id = $2
       AND user_id = $3
     RETURNING id`,
    [id, manager.schoolId, manager.userId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      { success: false, message: "Notification not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
