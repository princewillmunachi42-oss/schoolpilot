import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const membershipResult = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
       AND role = 'owner'
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can view this term.",
      },
      { status: 403 }
    );
  }

  const { id } = await params;

  const result = await pool.query(
    `SELECT
       id,
       academic_session_id,
       name,
       start_date,
       end_date,
       is_current
     FROM terms
     WHERE id = $1
       AND school_id = $2
     LIMIT 1`,
    [id, membership.school_id]
  );

  if (result.rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "Term not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    term: result.rows[0],
  });
}
