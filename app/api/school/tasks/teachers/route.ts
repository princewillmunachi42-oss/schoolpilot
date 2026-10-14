import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import pool from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await pool.query(
      `SELECT school_id FROM school_members
       WHERE user_id = $1 AND role = ANY($2::text[]) LIMIT 1`,
      [user.id, ["owner", "principal", "admin"]],
    );

    if (!membership.rows[0]) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT id, staff_id, first_name, last_name, role_title
       FROM staff
       WHERE school_id = $1
         AND status = 'active'
         AND user_id IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM school_members sm
           WHERE sm.user_id = staff.user_id
             AND sm.school_id = staff.school_id
             AND sm.role = 'teacher'
         )
       ORDER BY first_name, last_name`,
      [membership.rows[0].school_id],
    );

    return NextResponse.json({ teachers: result.rows });
  } catch (error) {
    console.error("Task teacher list error:", error);
    return NextResponse.json(
      { error: "Unable to load teachers." },
      { status: 500 },
    );
  }
}
