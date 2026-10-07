import { NextRequest, NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/auth/student";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import pool from "@/lib/db";

export async function POST(request: NextRequest) {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  let body: {
    currentPassword?: string;
    newPassword?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request body.",
      },
      { status: 400 }
    );
  }

  const currentPassword = String(
    body.currentPassword ?? ""
  );

  const newPassword = String(
    body.newPassword ?? ""
  );

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      {
        success: false,
        message: "Current password and new password are required.",
      },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      {
        success: false,
        message: "New password must be at least 8 characters.",
      },
      { status: 400 }
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Your new password must be different from your current password.",
      },
      { status: 400 }
    );
  }

  const userResult = await pool.query(
    `
      SELECT
        id,
        password_hash
      FROM users
      WHERE id = $1
        AND status = 'active'
      LIMIT 1
    `,
    [currentStudent.userId]
  );

  const user = userResult.rows[0];

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Student account not found.",
      },
      { status: 404 }
    );
  }

  const passwordValid = await verifyPassword(
    currentPassword,
    user.password_hash
  );

  if (!passwordValid) {
    return NextResponse.json(
      {
        success: false,
        message: "Current password is incorrect.",
      },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await pool.query(
    `
      UPDATE users
      SET
        password_hash = $1,
        updated_at = NOW()
      WHERE id = $2
    `,
    [passwordHash, currentStudent.userId]
  );

  return NextResponse.json({
    success: true,
    message: "Your password has been changed successfully.",
  });
}
