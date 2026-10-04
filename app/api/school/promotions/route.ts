import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

async function getOwnerSchool(userId: string) {
  const result = await pool.query(
    `
      SELECT
        sm.id,
        sm.school_id,
        sm.user_id,
        sm.role
      FROM school_members sm
      WHERE sm.user_id = $1
        AND sm.role = 'owner'
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const membership = await getOwnerSchool(user.id);

  if (!membership) {
    return NextResponse.json(
      { success: false, message: "Owner access required" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);

  const sessionId = searchParams.get("sessionId");
  const targetSessionId = searchParams.get("targetSessionId");

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        message: "sessionId is required",
      },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    const sessionResult = await client.query(
      `
        SELECT
          id,
          name,
          start_date,
          end_date,
          is_current
        FROM academic_sessions
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [sessionId, membership.school_id]
    );

    if (sessionResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Academic session not found",
        },
        { status: 404 }
      );
    }

    const studentsResult = await client.query(
      `
        SELECT
          se.id AS enrollment_id,
          se.student_id,
          se.academic_session_id,
          se.class_id,
          se.status AS enrollment_status,
          se.promotion_decision,
          se.next_class_id,

          s.admission_number,
          s.first_name,
          s.last_name,
          s.other_name,
          s.status AS student_status,

          c.name AS class_name,

          next_class.name AS next_class_name,

          cp.to_class_id AS configured_next_class_id,
          cp.repeat_class_id AS configured_repeat_class_id,

          repeat_class.name AS configured_repeat_class_name

        FROM student_enrollments se

        JOIN students s
          ON s.id = se.student_id
         AND s.school_id = se.school_id

        JOIN classes c
          ON c.id = se.class_id
         AND c.school_id = se.school_id

        LEFT JOIN classes next_class
          ON next_class.id = se.next_class_id
         AND next_class.school_id = se.school_id

        LEFT JOIN class_progressions cp
          ON cp.school_id = se.school_id
         AND cp.from_class_id = se.class_id
         ${
           targetSessionId
             ? "AND cp.to_academic_session_id = $3"
             : ""
         }

        LEFT JOIN classes repeat_class
          ON repeat_class.id = cp.repeat_class_id
         AND repeat_class.school_id = se.school_id

        WHERE se.school_id = $2
          AND se.academic_session_id = $1

        ORDER BY
          c.name,
          s.last_name,
          s.first_name
      `,
      targetSessionId
        ? [sessionId, membership.school_id, targetSessionId]
        : [sessionId, membership.school_id]
    );

    return NextResponse.json({
      success: true,
      session: sessionResult.rows[0],
      students: studentsResult.rows,
    });
  } catch (error) {
    console.error("Get promotions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to load promotion records",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const membership = await getOwnerSchool(user.id);

  if (!membership) {
    return NextResponse.json(
      { success: false, message: "Owner access required" },
      { status: 403 }
    );
  }

  let body: {
    enrollmentId?: string;
    decision?: string;
    nextClassId?: string | null;
    targetSessionId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid JSON request",
      },
      { status: 400 }
    );
  }

  const enrollmentId = body.enrollmentId?.trim();
  const decision = body.decision?.trim().toLowerCase();
  const nextClassId = body.nextClassId?.trim() || null;
  const targetSessionId = body.targetSessionId?.trim();

  const validDecisions = [
    "promote",
    "repeat",
    "graduate",
    "withdraw",
    "transfer",
  ];

  if (!enrollmentId || !decision || !targetSessionId) {
    return NextResponse.json(
      {
        success: false,
        message:
          "enrollmentId, decision, and targetSessionId are required",
      },
      { status: 400 }
    );
  }

  if (!validDecisions.includes(decision)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid promotion decision",
      },
      { status: 400 }
    );
  }

  if (decision === "promote" && !nextClassId) {
    return NextResponse.json(
      {
        success: false,
        message:
          "A target class is required when promoting a student",
      },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const enrollmentResult = await client.query(
      `
        SELECT
          se.id,
          se.student_id,
          se.school_id,
          se.academic_session_id,
          se.class_id,
          se.status,
          se.promotion_decision
        FROM student_enrollments se
        WHERE se.id = $1
          AND se.school_id = $2
        FOR UPDATE
      `,
      [enrollmentId, membership.school_id]
    );

    if (enrollmentResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Student enrollment not found",
        },
        { status: 404 }
      );
    }

    const enrollment = enrollmentResult.rows[0];

    if (enrollment.status !== "active") {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "This enrollment is no longer active",
        },
        { status: 409 }
      );
    }

    const targetSessionResult = await client.query(
      `
        SELECT id, name
        FROM academic_sessions
        WHERE id = $1
          AND school_id = $2
        LIMIT 1
      `,
      [targetSessionId, membership.school_id]
    );

    if (targetSessionResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Target academic session not found",
        },
        { status: 404 }
      );
    }

    if (decision === "promote") {
      const targetClassResult = await client.query(
        `
          SELECT id, name
          FROM classes
          WHERE id = $1
            AND school_id = $2
            AND academic_session_id = $3
            AND status = 'active'
          LIMIT 1
        `,
        [
          nextClassId,
          membership.school_id,
          targetSessionId,
        ]
      );

      if (targetClassResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            message:
              "The selected target class does not belong to the target academic session",
          },
          { status: 400 }
        );
      }
    }

    await client.query(
      `
        UPDATE student_enrollments
        SET
          promotion_decision = $1,
          next_class_id = $2,
          updated_at = NOW()
        WHERE id = $3
          AND school_id = $4
      `,
      [
        decision,
        decision === "promote" ? nextClassId : null,
        enrollmentId,
        membership.school_id,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Promotion decision saved",
      enrollmentId,
      decision,
      nextClassId:
        decision === "promote" ? nextClassId : null,
      targetSessionId,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Save promotion decision error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save promotion decision",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
