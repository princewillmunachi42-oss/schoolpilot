import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          authenticated: false,
          user: null,
          memberships: [],
        },
        { status: 401 }
      );
    }

    const membershipResult = await pool.query(
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

    return Response.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        emailVerified: user.email_verified,
      },
      memberships: membershipResult.rows,
    });
  } catch (error) {
    console.error("Current user error:", error);

    return Response.json(
      {
        authenticated: false,
        user: null,
        memberships: [],
      },
      { status: 500 }
    );
  }
}
