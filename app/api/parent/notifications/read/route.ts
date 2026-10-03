import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentParent } from "@/lib/auth/parent";

export async function GET(request: NextRequest) {
  try {
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const unreadOnly =
      searchParams.get("unread") === "true";

    const result = await pool.query(
      `SELECT
         id,
         title,
         message,
         type,
         link,
         is_read,
         created_at
       FROM notifications
       WHERE school_id = $1
         AND user_id = $2
         AND ($3 = FALSE OR is_read = FALSE)
       ORDER BY created_at DESC`,
      [
        parent.schoolId,
        parent.userId,
        unreadOnly,
      ]
    );

    const unreadResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE school_id = $1
         AND user_id = $2
         AND is_read = FALSE`,
      [parent.schoolId, parent.userId]
    );

    return NextResponse.json({
      notifications: result.rows,
      unreadCount: unreadResult.rows[0]?.count || 0,
    });
  } catch (error) {
    console.error("Parent notifications GET error:", error);

    return NextResponse.json(
      { error: "Failed to load notifications." },
      { status: 500 }
    );
  }
}
export async function PATCH(request: Request) {
  try {
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (body.markAll === true) {
      await pool.query(
        `UPDATE notifications
         SET is_read = TRUE
         WHERE school_id = $1
           AND user_id = $2
           AND is_read = FALSE`,
        [parent.schoolId, parent.userId]
      );

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    const notificationId = body.notificationId;

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
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1
         AND school_id = $2
         AND user_id = $3
       RETURNING id`,
      [
        notificationId,
        parent.schoolId,
        parent.userId,
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
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Parent notifications PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update notification.",
      },
      { status: 500 }
    );
  }
}
