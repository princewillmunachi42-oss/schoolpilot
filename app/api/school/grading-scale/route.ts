import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import {
  DEFAULT_GRADING_SCALE,
  validateGradingScale,
} from "@/lib/academics/grading";

async function getSchoolMembership(userId: string) {
  const result = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
       AND role IN ('owner', 'principal', 'admin')
     ORDER BY CASE role
       WHEN 'owner' THEN 1
       WHEN 'principal' THEN 2
       ELSE 3
     END
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getSchoolMembership(user.id);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT grading_scale
       FROM school_grading_scales
       WHERE school_id = $1
       LIMIT 1`,
      [membership.school_id]
    );

    const scale = result.rows[0]
      ? validateGradingScale(result.rows[0].grading_scale)
      : DEFAULT_GRADING_SCALE;

    return NextResponse.json({ grading_scale: scale });
  } catch (error) {
    console.error("Grading scale GET error:", error);
    return NextResponse.json(
      { error: "Failed to load grading scale." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getSchoolMembership(user.id);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const scale = validateGradingScale(body.grading_scale);

    const result = await pool.query(
      `INSERT INTO school_grading_scales (
         school_id,
         grading_scale,
         updated_by,
         updated_at
       )
       VALUES ($1, $2::jsonb, $3, NOW())
       ON CONFLICT (school_id)
       DO UPDATE SET
         grading_scale = EXCLUDED.grading_scale,
         updated_by = EXCLUDED.updated_by,
         updated_at = NOW()
       RETURNING grading_scale`,
      [membership.school_id, JSON.stringify(scale), user.id]
    );

    return NextResponse.json({
      message: "Grading scale saved.",
      grading_scale: validateGradingScale(result.rows[0].grading_scale),
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Grading scale PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save grading scale." },
      { status: 500 }
    );
  }
}
