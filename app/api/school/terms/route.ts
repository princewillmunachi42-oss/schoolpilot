import { NextResponse } from "next/server";
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
      { success: false, message: "Unauthorized." },
      { status: 403 }
    );
  }

  const result = await pool.query(
    `SELECT
       t.id,
       t.name,
       t.start_date,
       t.end_date,
       t.is_current,
       t.academic_session_id,
       ac.name AS session_name
     FROM terms t
     JOIN academic_sessions ac
       ON ac.id = t.academic_session_id
     WHERE t.school_id = $1
     ORDER BY ac.start_date DESC, t.start_date ASC`,
    [schoolId]
  );

  return NextResponse.json({
    success: true,
    terms: result.rows,
  });
}

export async function POST(request: Request) {
  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 403 }
    );
  }

const formData = await request.formData();

const body = {
  academicSessionId: String(formData.get("academicSessionId") ?? ""),
  name: String(formData.get("name") ?? ""),
  startDate: String(formData.get("startDate") ?? ""),
  endDate: String(formData.get("endDate") ?? ""),
  isCurrent: formData.get("isCurrent") === "true",
};

  const {
    academicSessionId,
    name,
    startDate,
    endDate,
    isCurrent,
  } = body;

  if (
    !academicSessionId ||
    !name ||
    !startDate ||
    !endDate
  ) {
    return NextResponse.json(
      { success: false, message: "All required fields must be provided." },
      { status: 400 }
    );
  }

  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json(
      { success: false, message: "End date must be after start date." },
      { status: 400 }
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

  if (sessionResult.rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "Academic session not found." },
      { status: 404 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (Boolean(isCurrent)) {
      await client.query(
        `UPDATE terms
         SET is_current = FALSE,
             updated_at = NOW()
         WHERE school_id = $1`,
        [schoolId]
      );
    }

    await client.query(
      `INSERT INTO terms (
         school_id,
         academic_session_id,
         name,
         start_date,
         end_date,
         is_current
       )
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        schoolId,
        academicSessionId,
        String(name).trim(),
        startDate,
        endDate,
        Boolean(isCurrent),
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Term created successfully.",
    });
  } catch {
    await client.query("ROLLBACK");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create term. The term may already exist.",
      },
      { status: 409 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request: Request) {
  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 403 }
    );
  }

  const body = await request.json();

  const {
    id,
    academicSessionId,
    name,
    startDate,
    endDate,
    isCurrent,
  } = body;

  if (
    !id ||
    !academicSessionId ||
    !name ||
    !startDate ||
    !endDate
  ) {
    return NextResponse.json(
      { success: false, message: "All required fields must be provided." },
      { status: 400 }
    );
  }

  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json(
      { success: false, message: "End date must be after start date." },
      { status: 400 }
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

  if (sessionResult.rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "Academic session not found." },
      { status: 404 }
    );
  }

  const existingResult = await pool.query(
    `SELECT id
     FROM terms
     WHERE id = $1
       AND school_id = $2
     LIMIT 1`,
    [id, schoolId]
  );

  if (existingResult.rows.length === 0) {
    return NextResponse.json(
      { success: false, message: "Term not found." },
      { status: 404 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (Boolean(isCurrent)) {
      await client.query(
        `UPDATE terms
         SET is_current = FALSE,
             updated_at = NOW()
         WHERE school_id = $1
           AND id <> $2`,
        [schoolId, id]
      );
    }

    await client.query(
      `UPDATE terms
       SET academic_session_id = $1,
           name = $2,
           start_date = $3,
           end_date = $4,
           is_current = $5,
           updated_at = NOW()
       WHERE id = $6
         AND school_id = $7`,
      [
        academicSessionId,
        String(name).trim(),
        startDate,
        endDate,
        Boolean(isCurrent),
        id,
        schoolId,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Term updated successfully.",
    });
  } catch {
    await client.query("ROLLBACK");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update term. The term may already exist.",
      },
      { status: 409 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: Request) {
  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Term ID is required." },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `DELETE FROM terms
       WHERE id = $1
         AND school_id = $2
       RETURNING id`,
      [id, schoolId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Term not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Term deleted successfully.",
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message:
          "This term cannot be deleted because it is already being used by attendance, results, fees, or timetable records.",
      },
      { status: 409 }
    );
  }
}
