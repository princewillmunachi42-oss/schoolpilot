import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import pool from "@/lib/db";

async function getOwnerMembership(userId: string) {
  const result = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );

  const membership = result.rows[0];

  if (!membership || membership.role !== "owner") {
    return null;
  }

  return membership;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required.",
      },
      { status: 401 }
    );
  }

  const membership = await getOwnerMembership(user.id);

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can access communications.",
      },
      { status: 403 }
    );
  }

  const parentsResult = await pool.query(
    `SELECT
       p.id AS parent_id,
       p.user_id,
       p.full_name,
       p.email,
       p.phone,
       p.status
     FROM parents p
     WHERE p.school_id = $1
     ORDER BY p.full_name ASC`,
    [membership.school_id]
  );

  const studentsResult = await pool.query(
    `SELECT
       s.id,
       s.first_name,
       s.last_name,
       s.other_name,
       s.admission_number,
       c.name AS class_name
     FROM students s
     LEFT JOIN classes c
       ON c.id = s.class_id
      AND c.school_id = s.school_id
     WHERE s.school_id = $1
       AND s.status = 'active'
     ORDER BY s.first_name, s.last_name`,
    [membership.school_id]
  );

  const communicationsResult = await pool.query(
    `SELECT
       c.id,
       c.subject,
       c.message,
       c.type,
       c.is_read,
       c.student_id,
       c.recipient_user_id,
       c.created_at,

       p.full_name AS recipient_name,
       p.email AS recipient_email,

       s.first_name AS student_first_name,
       s.last_name AS student_last_name,
       s.admission_number

     FROM communications c

     LEFT JOIN parents p
       ON p.user_id = c.recipient_user_id
      AND p.school_id = c.school_id

     LEFT JOIN students s
       ON s.id = c.student_id
      AND s.school_id = c.school_id

     WHERE c.school_id = $1
     ORDER BY c.created_at DESC`,
    [membership.school_id]
  );

  return NextResponse.json({
    success: true,
    parents: parentsResult.rows,
    students: studentsResult.rows,
    communications: communicationsResult.rows,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication required.",
      },
      { status: 401 }
    );
  }

  const membership = await getOwnerMembership(user.id);

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can send communications.",
      },
      { status: 403 }
    );
  }

  let body: {
    recipientUserId?: string;
    studentId?: string | null;
    subject?: string;
    message?: string;
    type?: string;
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

  const recipientUserId = String(body.recipientUserId ?? "").trim();
  const studentId = body.studentId
    ? String(body.studentId).trim()
    : null;
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();
  const type = String(body.type ?? "general").trim() || "general";

  if (!recipientUserId) {
    return NextResponse.json(
      {
        success: false,
        message: "A parent recipient is required.",
      },
      { status: 400 }
    );
  }

  if (!subject) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject is required.",
      },
      { status: 400 }
    );
  }

  if (subject.length > 200) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject must not exceed 200 characters.",
      },
      { status: 400 }
    );
  }

  if (!message) {
    return NextResponse.json(
      {
        success: false,
        message: "Message is required.",
      },
      { status: 400 }
    );
  }

  const parentResult = await pool.query(
    `SELECT
       id,
       user_id,
       full_name
     FROM parents
     WHERE user_id = $1
       AND school_id = $2
       AND status = 'active'
     LIMIT 1`,
    [recipientUserId, membership.school_id]
  );

  const parent = parentResult.rows[0];

  if (!parent) {
    return NextResponse.json(
      {
        success: false,
        message: "The selected parent does not belong to this school.",
      },
      { status: 400 }
    );
  }

  if (studentId) {
    const studentParentResult = await pool.query(
      `SELECT 1
       FROM parent_students ps
       INNER JOIN students s
         ON s.id = ps.student_id
        AND s.school_id = ps.school_id
       WHERE ps.parent_id = $1
         AND ps.school_id = $2
         AND ps.student_id = $3
         AND s.status = 'active'
       LIMIT 1`,
      [parent.id, membership.school_id, studentId]
    );

    if (studentParentResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected student is not linked to the selected parent.",
        },
        { status: 400 }
      );
    }
  }

  const result = await pool.query(
    `INSERT INTO communications (
       school_id,
       sender_user_id,
       recipient_user_id,
       student_id,
       subject,
       message,
       type
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING
       id,
       subject,
       message,
       type,
       is_read,
       student_id,
       recipient_user_id,
       created_at`,
    [
      membership.school_id,
      user.id,
      recipientUserId,
      studentId,
      subject,
      message,
      type,
    ]
  );

  return NextResponse.json(
    {
      success: true,
      message: "Communication sent successfully.",
      communication: result.rows[0],
    },
    { status: 201 }
  );
}	
