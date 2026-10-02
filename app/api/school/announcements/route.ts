	import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

async function getMembership(userId: string) {
  const result = await pool.query(
    `
      SELECT
        sm.school_id,
        sm.role
      FROM school_members sm
      WHERE sm.user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function GET() {
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

  const allowedRoles = [
    "owner",
    "principal",
    "admin",
    "teacher",
    "accountant",
    "parent",
    "student",
  ];

  if (!allowedRoles.includes(membership.role)) {
    return NextResponse.json(
      { success: false, message: "Access denied." },
      { status: 403 }
    );
  }

  const result = await pool.query(
    `
      SELECT
        a.id,
        a.title,
        a.content,
        a.audience,
        a.status,
        a.published_at,
        a.created_at,
        a.updated_at,
        u.first_name AS created_by_first_name,
        u.last_name AS created_by_last_name
      FROM announcements a
      JOIN users u ON u.id = a.created_by
      WHERE a.school_id = $1
        AND a.status = 'published'
        AND (
          a.audience = 'all'
          OR a.audience = $2
        )
      ORDER BY
        COALESCE(a.published_at, a.created_at) DESC,
        a.created_at DESC
    `,
    [membership.school_id, `${membership.role}s`]
  );

  return NextResponse.json({
    success: true,
    announcements: result.rows,
  });
}

export async function POST(request: NextRequest) {
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
      {
        success: false,
        message: "Only school administrators can create announcements.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  const audience = String(body.audience ?? "all").trim();
  const status = String(body.status ?? "published").trim();
  const signatureData = String(body.signature_data ?? "").trim();
  if (!title || !content) {
    return NextResponse.json(
      {
        success: false,
        message: "Title and content are required.",
      },
      { status: 400 }
    );
  }

  if (title.length > 200) {
    return NextResponse.json(
      {
        success: false,
        message: "Title must be 200 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (!["all", "teachers", "students", "parents"].includes(audience)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid announcement audience.",
      },
      { status: 400 }
    );
  }

  if (!["draft", "published"].includes(status)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid announcement status.",
      },
      { status: 400 }
    );
  }
 if (status === "published" && !signatureData) {
  return NextResponse.json(
    {
      success: false,
      message: "A signature is required when publishing an announcement.",
    },
    { status: 400 }
  );
}
  const publishedAt = status === "published" ? new Date() : null;

  const result = await pool.query(
    `
        INSERT INTO announcements (
  school_id,
  created_by,
  title,
  content,
  audience,
  status,
  published_at,
  signature_data
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        title,
        content,
        audience,
        status,
        published_at,
        created_at,
        updated_at
    `,
    [
  membership.school_id,
  user.id,
  title,
  content,
  audience,
  status,
  publishedAt,
  signatureData || null,
]
  );

  return NextResponse.json(
    {
      success: true,
      announcement: result.rows[0],
    },
    { status: 201 }
  );
}
export async function PUT(request: NextRequest) {
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

  const body = await request.json();

  const id = String(body.id ?? "").trim();
  const title = String(body.title ?? "").trim();
  const content = String(body.content ?? "").trim();
  const audience = String(body.audience ?? "all").trim();
  const status = String(body.status ?? "draft").trim();
  const signatureData = String(body.signature_data ?? "").trim();

  if (!id || !title || !content) {
    return NextResponse.json(
      {
        success: false,
        message: "Announcement ID, title and content are required.",
      },
      { status: 400 }
    );
  }

  if (title.length > 200) {
    return NextResponse.json(
      {
        success: false,
        message: "Title must be 200 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (!["all", "teachers", "students", "parents"].includes(audience)) {
    return NextResponse.json(
      { success: false, message: "Invalid announcement audience." },
      { status: 400 }
    );
  }

  if (!["draft", "published"].includes(status)) {
    return NextResponse.json(
      { success: false, message: "Invalid announcement status." },
      { status: 400 }
    );
  }

  if (status === "published" && !signatureData) {
    return NextResponse.json(
      {
        success: false,
        message: "A signature is required when publishing an announcement.",
      },
      { status: 400 }
    );
  }

  const existing = await pool.query(
    `
      SELECT id, status
      FROM announcements
      WHERE id = $1
        AND school_id = $2
      LIMIT 1
    `,
    [id, membership.school_id]
  );

  if (!existing.rows[0]) {
    return NextResponse.json(
      { success: false, message: "Announcement not found." },
      { status: 404 }
    );
  }

  const publishedAt =
    status === "published"
      ? new Date()
      : null;

  const result = await pool.query(
    `
      UPDATE announcements
      SET
        title = $1,
        content = $2,
        audience = $3,
        status = $4,
        published_at = $5,
        signature_data = $6,
        updated_at = NOW()
      WHERE id = $7
        AND school_id = $8
      RETURNING
        id,
        title,
        content,
        audience,
        status,
        published_at,
        created_at,
        updated_at,
        signature_data
    `,
    [
      title,
      content,
      audience,
      status,
      publishedAt,
      signatureData || null,
      id,
      membership.school_id,
    ]
  );

  return NextResponse.json({
    success: true,
    announcement: result.rows[0],
  });
}

export async function DELETE(request: NextRequest) {
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

  const body = await request.json();
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Announcement ID is required." },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `
      DELETE FROM announcements
      WHERE id = $1
        AND school_id = $2
      RETURNING id
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
    message: "Announcement deleted successfully.",
  });
}
