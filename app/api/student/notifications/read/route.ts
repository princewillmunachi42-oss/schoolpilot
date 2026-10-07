import { NextRequest, NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/auth/student";
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
    notificationId?: string;
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

  const notificationId = String(
    body.notificationId ?? ""
  ).trim();

  if (!notificationId) {
    return NextResponse.json(
      {
        success: false,
        message: "Notification ID is required.",
      },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
        AND school_id = $2
        AND user_id = $3
      RETURNING id, is_read
    `,
    [
      notificationId,
      currentStudent.schoolId,
      currentStudent.userId,
    ]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Notification not found.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    notification: result.rows[0],
  });
}
