import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

async function getMembership(userId: string) {
  const result = await pool.query(
    `
      SELECT school_id, role
      FROM school_members
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0];
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const membership = await getMembership(user.id);

  if (!membership) {
    return NextResponse.json(
      { success: false, message: "School membership not found." },
      { status: 403 }
    );
  }

  if (!["owner", "principal", "admin"].includes(membership.role)) {
    return NextResponse.json(
      { success: false, message: "Access denied." },
      { status: 403 }
    );
  }

  const { id } = await context.params;

  const result = await pool.query(
    `
      SELECT
        id,
        title,
        content,
        audience,
        status,
        published_at,
        created_at,
        updated_at,
        signature_data
      FROM announcements
      WHERE id = $1
        AND school_id = $2
      LIMIT 1
    `,
    [id, membership.school_id]
  );

  if (!result.rows[0]) {
    return NextResponse.json(
      { success: false, message: "Announcement not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    announcement: result.rows[0],
  });
}
