import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getMobileUser } from "@/lib/auth/mobile-session";

export async function GET(request: NextRequest) {
  try {
    const user = await getMobileUser(request);

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null, memberships: [] },
        { status: 401 }
      );
    }

    const result = await pool.query(
      `SELECT
         sm.school_id,
         sm.role,
         s.name AS school_name
       FROM school_members sm
       JOIN schools s ON s.id = sm.school_id
       WHERE sm.user_id = $1
       ORDER BY sm.created_at ASC`,
      [user.id]
    );

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
      },
      memberships: result.rows,
    });
  } catch (error) {
    console.error("Mobile session validation error:", error);

    return NextResponse.json(
      { authenticated: false, message: "Unable to validate session." },
      { status: 500 }
    );
  }
}
