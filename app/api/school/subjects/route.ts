import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

async function getOwnerSchoolId() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const result = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
       AND role = 'owner'
     LIMIT 1`,
    [user.id]
  );

  return result.rows[0]?.school_id ?? null;
}

export async function GET() {
  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 403 }
    );
  }

  const result = await pool.query(
    `SELECT
       id,
       name,
       code,
       description,
       status
     FROM subjects
     WHERE school_id = $1
     ORDER BY name ASC`,
    [schoolId]
  );

  return NextResponse.json({
    success: true,
    subjects: result.rows,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();

  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "active"
  ).trim();

  if (!name || !code) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject name and code are required.",
      },
      { status: 400 }
    );
  }

  if (name.length > 100) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject name must be 100 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (code.length > 30) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject code must be 30 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (status !== "active" && status !== "inactive") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid subject status.",
      },
      { status: 400 }
    );
  }

  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can manage subjects.",
      },
      { status: 403 }
    );
  }

  try {
    await pool.query(
      `INSERT INTO subjects (
         school_id,
         name,
         code,
         description,
         status
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        schoolId,
        name,
        code,
        description || null,
        status,
      ]
    );

    return NextResponse.redirect(
      new URL("/dashboard/subjects?created=1", request.url)
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create subject. A subject with this name or code may already exist.",
      },
      { status: 409 }
    );
  }
}

export async function PUT(request: Request) {
  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const {
    id,
    name,
    code,
    description,
    status,
  } = body;

  if (!id || !name || !code) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject ID, name, and code are required.",
      },
      { status: 400 }
    );
  }

  if (String(name).trim().length > 100) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject name must be 100 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (String(code).trim().length > 30) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject code must be 30 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (status !== "active" && status !== "inactive") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid subject status.",
      },
      { status: 400 }
    );
  }

  const existingResult = await pool.query(
    `SELECT id
     FROM subjects
     WHERE id = $1
       AND school_id = $2
     LIMIT 1`,
    [id, schoolId]
  );

  if (!existingResult.rowCount) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject not found.",
      },
      { status: 404 }
    );
  }

  try {
    await pool.query(
      `UPDATE subjects
       SET name = $1,
           code = $2,
           description = $3,
           status = $4
       WHERE id = $5
         AND school_id = $6`,
      [
        String(name).trim(),
        String(code).trim().toUpperCase(),
        String(description ?? "").trim() || null,
        status,
        id,
        schoolId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Subject updated successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update subject. A subject with this name or code may already exist.",
      },
      { status: 409 }
    );
  }
}

export async function DELETE(request: Request) {
  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Subject ID is required.",
      },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `UPDATE subjects
     SET status = 'inactive'
     WHERE id = $1
       AND school_id = $2
       AND status = 'active'
     RETURNING id`,
    [id, schoolId]
  );

  if (!result.rowCount) {
    return NextResponse.json(
      {
        success: false,
        message: "Active subject not found.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Subject deactivated successfully.",
  });
}
