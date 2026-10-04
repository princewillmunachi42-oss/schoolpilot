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
    `
      SELECT
        cp.id,
        cp.from_class_id,
        cp.to_class_id,
        cp.repeat_class_id,
        cp.to_academic_session_id,

        from_class.name AS from_class_name,
        from_class.academic_session_id AS from_academic_session_id,

        to_class.name AS to_class_name,

        repeat_class.name AS repeat_class_name,

        target_session.name AS to_session_name

      FROM class_progressions cp

      JOIN classes from_class
        ON from_class.id = cp.from_class_id
       AND from_class.school_id = cp.school_id

      LEFT JOIN classes to_class
        ON to_class.id = cp.to_class_id
       AND to_class.school_id = cp.school_id

      LEFT JOIN classes repeat_class
        ON repeat_class.id = cp.repeat_class_id
       AND repeat_class.school_id = cp.school_id

      JOIN academic_sessions target_session
        ON target_session.id = cp.to_academic_session_id
       AND target_session.school_id = cp.school_id

      WHERE cp.school_id = $1

      ORDER BY
        target_session.start_date ASC,
        from_class.name ASC
    `,
    [schoolId]
  );

  return NextResponse.json({
    success: true,
    progressions: result.rows,
  });
}

export async function POST(request: NextRequest) {
  const schoolId = await getOwnerSchoolId();

  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can manage class progressions.",
      },
      { status: 403 }
    );
  }

  let body: {
    fromClassId?: string;
    toClassId?: string | null;
    repeatClassId?: string | null;
    toAcademicSessionId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON request.",
      },
      { status: 400 }
    );
  }

  const fromClassId = body.fromClassId?.trim();
  const toClassId = body.toClassId?.trim() || null;
  const repeatClassId = body.repeatClassId?.trim() || null;
  const toAcademicSessionId =
    body.toAcademicSessionId?.trim();

  if (!fromClassId || !toAcademicSessionId) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Source class and target academic session are required.",
      },
      { status: 400 }
    );
  }

  if (!toClassId && !repeatClassId) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Configure at least a promotion class or repeat class.",
      },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const sourceClassResult = await client.query(
      `
        SELECT
          id,
          academic_session_id
        FROM classes
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [fromClassId, schoolId]
    );

    if (sourceClassResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Source class not found.",
        },
        { status: 404 }
      );
    }

    const targetSessionResult = await client.query(
      `
        SELECT id
        FROM academic_sessions
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [toAcademicSessionId, schoolId]
    );

    if (targetSessionResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Target academic session not found.",
        },
        { status: 404 }
      );
    }

    if (toClassId) {
      const result = await client.query(
        `
          SELECT id
          FROM classes
          WHERE id = $1
            AND school_id = $2
            AND academic_session_id = $3
            AND status = 'active'
          LIMIT 1
        `,
        [toClassId, schoolId, toAcademicSessionId]
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            message:
              "Promotion class must belong to the target academic session.",
          },
          { status: 400 }
        );
      }
    }

    if (repeatClassId) {
      const result = await client.query(
        `
          SELECT id
          FROM classes
          WHERE id = $1
            AND school_id = $2
            AND academic_session_id = $3
            AND status = 'active'
          LIMIT 1
        `,
        [repeatClassId, schoolId, toAcademicSessionId]
      );

      if (result.rowCount === 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            message:
              "Repeat class must belong to the target academic session.",
          },
          { status: 400 }
        );
      }
    }

    const result = await client.query(
      `
        INSERT INTO class_progressions (
          school_id,
          from_class_id,
          to_class_id,
          repeat_class_id,
          to_academic_session_id
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (school_id, from_class_id)
        DO UPDATE SET
          to_class_id = EXCLUDED.to_class_id,
          repeat_class_id = EXCLUDED.repeat_class_id,
          to_academic_session_id = EXCLUDED.to_academic_session_id
        RETURNING
          id,
          from_class_id,
          to_class_id,
          repeat_class_id,
          to_academic_session_id
      `,
      [
        schoolId,
        fromClassId,
        toClassId,
        repeatClassId,
        toAcademicSessionId,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Class progression saved.",
      progression: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Save class progression error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to save class progression.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Progression ID is required.",
      },
      { status: 400 }
    );
  }

  const result = await pool.query(
    `
      DELETE FROM class_progressions
      WHERE id = $1
        AND school_id = $2
      RETURNING id
    `,
    [id, schoolId]
  );

  if (result.rowCount === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Class progression not found.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Class progression deleted.",
  });
}
