import { NextResponse } from "next/server";
import { getCurrentParent } from "@/lib/auth/parent";
import pool from "@/lib/db";

export async function GET() {
  const parent = await getCurrentParent();

  if (!parent) {
    return NextResponse.json(
      {
        success: false,
        message: "Parent account not found.",
      },
      { status: 401 }
    );
  }

  const childrenResult = await pool.query(
    `SELECT
       s.id,
       s.first_name,
       s.last_name,
       s.other_name,
       s.admission_number,
       s.class_id,
       c.name AS class_name
     FROM parent_students ps
     INNER JOIN students s
       ON s.id = ps.student_id
      AND s.school_id = ps.school_id
     LEFT JOIN classes c
       ON c.id = s.class_id
      AND c.school_id = s.school_id
     WHERE ps.parent_id = $1
       AND ps.school_id = $2
       AND s.status = 'active'
     ORDER BY s.first_name, s.last_name`,
    [parent.parentId, parent.schoolId]
  );

  const children = childrenResult.rows;
  const childIds = children.map((child) => child.id);

  const announcementsResult = await pool.query(
    `SELECT
       id,
       title,
       content,
       audience,
       published_at,
       created_at
     FROM announcements
     WHERE school_id = $1
       AND status = 'published'
       AND audience IN ('all', 'parents')
     ORDER BY
       published_at DESC NULLS LAST,
       created_at DESC`,
    [parent.schoolId]
  );

  let assignments: unknown[] = [];

  if (children.length > 0) {
    const classIds = children
      .map((child) => child.class_id)
      .filter(Boolean);

    if (classIds.length > 0) {
      const assignmentsResult = await pool.query(
        `SELECT
           a.id,
           a.class_id,
           a.subject_id,
           a.title,
           a.description,
           a.due_date,
           a.status,
           a.created_at,
           c.name AS class_name,
           sub.name AS subject_name,
           sub.code AS subject_code,
           st.first_name AS teacher_first_name,
           st.last_name AS teacher_last_name
         FROM assignments a
         INNER JOIN classes c
           ON c.id = a.class_id
          AND c.school_id = a.school_id
         INNER JOIN subjects sub
           ON sub.id = a.subject_id
          AND sub.school_id = a.school_id
         INNER JOIN staff st
           ON st.id = a.staff_id
          AND st.school_id = a.school_id
         WHERE a.school_id = $1
           AND a.status = 'published'
           AND a.class_id = ANY($2::uuid[])
         ORDER BY
           a.due_date ASC NULLS LAST,
           a.created_at DESC`,
        [parent.schoolId, classIds]
      );

      assignments = assignmentsResult.rows;
    }
  }

  const communicationsResult = await pool.query(
    `SELECT
       c.id,
       c.subject,
       c.message,
       c.type,
       c.is_read,
       c.student_id,
       c.created_at,
       s.first_name AS student_first_name,
       s.last_name AS student_last_name
     FROM communications c
     LEFT JOIN students s
       ON s.id = c.student_id
      AND s.school_id = c.school_id
     WHERE c.school_id = $1
       AND c.recipient_user_id = $2
       AND (
         c.student_id IS NULL
         OR c.student_id = ANY($3::uuid[])
       )
     ORDER BY c.created_at DESC`,
    [parent.schoolId, parent.userId, childIds]
  );

  const communications = communicationsResult.rows;

  const unreadCount = communications.filter(
    (communication) => !communication.is_read
  ).length;

  return NextResponse.json({
    success: true,
    children,
    announcements: announcementsResult.rows,
    assignments,
    communications,
    unreadCount,
  });
}
export async function PATCH(request: Request) {
  try {
    const parent = await getCurrentParent();

    if (!parent) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent account not found.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const communicationId = body.communicationId;

    if (!communicationId) {
      return NextResponse.json(
        {
          success: false,
          message: "Communication ID is required.",
        },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE communications
       SET is_read = TRUE
       WHERE id = $1
         AND school_id = $2
         AND recipient_user_id = $3
       RETURNING id`,
      [
        communicationId,
        parent.schoolId,
        parent.userId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Communication not found.",
        },
        { status: 404 }
      );
    }

        await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE school_id = $1
         AND user_id = $2
         AND type = 'communication'
         AND link = $3
         AND is_read = FALSE`,
      [
        parent.schoolId,
        parent.userId,
        `/parent/communications?communicationId=${communicationId}`,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Communication marked as read.",
    });
  } catch (error) {
    console.error("Parent communications PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to mark communication as read.",
      },
      { status: 500 }
    );
  }
}
