import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createMobileSession } from "@/lib/auth/mobile-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const identifier = String(
      body.identifier ?? body.email ?? ""
    ).trim();

    const password = String(body.password ?? "");

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Login ID/email and password are required.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT
         id,
         email,
         login_id,
         password_hash,
         first_name,
         last_name,
         status
       FROM users
       WHERE LOWER(email) = LOWER($1)
          OR LOWER(login_id) = LOWER($1)
       LIMIT 1`,
      [identifier]
    );

    const user = result.rows[0];

    if (
      !user ||
      user.status !== "active" ||
      !(await verifyPassword(password, user.password_hash))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Login ID/email or password.",
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

    const memberships = membershipResult.rows;

    if (memberships.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This account is not linked to a school.",
        },
        { status: 403 }
      );
    }

    const studentMembership = memberships.find(
      (membership) => membership.role === "student"
    );

    if (studentMembership) {
      const studentResult = await pool.query(
        `SELECT st.portal_enabled, st.status
         FROM students st
         WHERE st.user_id = $1
           AND st.school_id = $2
         LIMIT 1`,
        [user.id, studentMembership.school_id]
      );

      const student = studentResult.rows[0];

      if (
        !student ||
        student.portal_enabled !== true ||
        student.status !== "active"
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "Student Portal access is not enabled for this account.",
          },
          { status: 403 }
        );
      }
    }

    const session = await createMobileSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Login successful.",
      token: session.token,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        loginId: user.login_id,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      memberships,
    });
  } catch (error) {
    console.error("Mobile login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to log in.",
      },
      { status: 500 }
    );
  }
}
