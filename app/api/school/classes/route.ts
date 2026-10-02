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
       academic_session_id,
       capacity,
       status
     FROM classes
     WHERE school_id = $1
     ORDER BY name ASC`,
    [schoolId]
  );

  return NextResponse.json({
    success: true,
    classes: result.rows,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const academicSessionId = String(
    formData.get("academicSessionId") ?? ""
  ).trim();

  const name = String(formData.get("name") ?? "").trim();

  const capacityValue = String(
    formData.get("capacity") ?? ""
  ).trim();

  const status = String(
    formData.get("status") ?? "active"
  ).trim();

  if (!academicSessionId || !name) {
    return NextResponse.json(
      {
        success: false,
        message: "Academic session and class name are required.",
      },
      { status: 400 }
    );
  }

  if (status !== "active" && status !== "inactive") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid class status.",
      },
      { status: 400 }
    );
  }

  let capacity: number | null = null;

  if (capacityValue) {
    const parsedCapacity = Number(capacityValue);

    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Capacity must be a positive whole number.",
        },
        { status: 400 }
      );
    }

    capacity = parsedCapacity;
  }

  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can manage classes.",
      },
      { status: 403 }
    );
  }

  const sessionResult = await pool.query(
    `SELECT id
     FROM academic_sessions
     WHERE id = $1
       AND school_id = $2
     LIMIT 1`,
    [academicSessionId, schoolId]
  );

  if (!sessionResult.rowCount) {
    return NextResponse.json(
      {
        success: false,
        message: "Academic session not found for this school.",
      },
      { status: 404 }
    );
  }

  try {
    await pool.query(
      `INSERT INTO classes (
         school_id,
         academic_session_id,
         name,
         capacity,
         status
       )
       VALUES ($1, $2, $3, $4, $5)`,
      [
        schoolId,
        academicSessionId,
        name,
        capacity,
        status,
      ]
    );

    return NextResponse.redirect(
      new URL("/dashboard/classes?created=1", request.url)
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create class. A class with this name may already exist in this academic session.",
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
    academicSessionId,
    name,
    capacity,
    status,
  } = body;

  if (!id || !academicSessionId || !name) {
    return NextResponse.json(
      {
        success: false,
        message: "Academic session, class name, and class ID are required.",
      },
      { status: 400 }
    );
  }

  if (status !== "active" && status !== "inactive") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid class status.",
      },
      { status: 400 }
    );
  }

  let parsedCapacity: number | null = null;

  if (
    capacity !== null &&
    capacity !== undefined &&
    String(capacity).trim() !== ""
  ) {
    parsedCapacity = Number(capacity);

    if (
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity < 1
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Capacity must be a positive whole number.",
        },
        { status: 400 }
      );
    }
  }

  const sessionResult = await pool.query(
    `SELECT id
     FROM academic_sessions
     WHERE id = $1
       AND school_id = $2
     LIMIT 1`,
    [academicSessionId, schoolId]
  );

  if (!sessionResult.rowCount) {
    return NextResponse.json(
      {
        success: false,
        message: "Academic session not found for this school.",
      },
      { status: 404 }
    );
  }

  const existingResult = await pool.query(
    `SELECT id
     FROM classes
     WHERE id = $1
       AND school_id = $2
     LIMIT 1`,
    [id, schoolId]
  );

  if (!existingResult.rowCount) {
    return NextResponse.json(
      {
        success: false,
        message: "Class not found.",
      },
      { status: 404 }
    );
  }

  try {
    await pool.query(
      `UPDATE classes
       SET academic_session_id = $1,
           name = $2,
           capacity = $3,
           status = $4
       WHERE id = $5
         AND school_id = $6`,
      [
        academicSessionId,
        String(name).trim(),
        parsedCapacity,
        status,
        id,
        schoolId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Class updated successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to update class. A class with this name may already exist in this academic session.",
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
        message: "Class ID is required.",
      },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `UPDATE classes
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
        message: "Active class not found.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Class deactivated successfully.",
  });
}
