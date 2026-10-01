import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

async function getOwnerSchool(userId: string) {
  const result = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
       AND role = 'owner'
     LIMIT 1`,
    [userId]
  );

  return result.rows[0]?.school_id ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = await getOwnerSchool(user.id);

    if (!schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const studentId = request.nextUrl.searchParams.get("student_id");

    if (!studentId) {
      return NextResponse.json(
        { error: "student_id is required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT
         f.id,
         f.student_id,
         f.fee_name,
         f.amount_due,
         f.amount_paid,
         (f.amount_due - f.amount_paid) AS balance,
         f.due_date,
         f.status,
         f.remarks,
         f.academic_session_id,
         f.term_id,
         s.name AS session_name,
         t.name AS term_name
       FROM student_fees f
       INNER JOIN academic_sessions s
         ON s.id = f.academic_session_id
        AND s.school_id = f.school_id
       INNER JOIN terms t
         ON t.id = f.term_id
        AND t.school_id = f.school_id
       WHERE f.school_id = $1
         AND f.student_id = $2
       ORDER BY f.due_date DESC NULLS LAST, f.created_at DESC`,
      [schoolId, studentId]
    );

    return NextResponse.json({
      fees: result.rows,
    });
  } catch (error) {
    console.error("Fees GET error:", error);

    return NextResponse.json(
      { error: "Failed to load fee records" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = await getOwnerSchool(user.id);

    if (!schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const {
      student_id,
      academic_session_id,
      term_id,
      fee_name,
      amount_due,
      amount_paid,
      due_date,
      status,
      remarks,
    } = body;

    if (
      !student_id ||
      !academic_session_id ||
      !term_id ||
      !fee_name ||
      amount_due === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fee fields" },
        { status: 400 }
      );
    }

    const due = Number(amount_due);
    const paid = amount_paid === undefined ? 0 : Number(amount_paid);

    if (
      !Number.isFinite(due) ||
      !Number.isFinite(paid) ||
      due < 0 ||
      paid < 0 ||
      paid > due
    ) {
      return NextResponse.json(
        { error: "Invalid fee amount or payment amount" },
        { status: 400 }
      );
    }

    const studentCheck = await pool.query(
      `SELECT id
       FROM students
       WHERE id = $1
         AND school_id = $2
       LIMIT 1`,
      [student_id, schoolId]
    );

    if (!studentCheck.rows[0]) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const validStatuses = [
      "pending",
      "partial",
      "paid",
      "overdue",
      "waived",
    ];

    const feeStatus =
      status && validStatuses.includes(status)
        ? status
        : paid === due
          ? "paid"
          : paid > 0
            ? "partial"
            : "pending";

    const result = await pool.query(
      `INSERT INTO student_fees (
         school_id,
         student_id,
         academic_session_id,
         term_id,
         fee_name,
         amount_due,
         amount_paid,
         due_date,
         status,
         remarks
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING
         id,
         student_id,
         fee_name,
         amount_due,
         amount_paid,
         (amount_due - amount_paid) AS balance,
         due_date,
         status,
         remarks,
         academic_session_id,
         term_id`,
      [
        schoolId,
        student_id,
        academic_session_id,
        term_id,
        fee_name,
        due,
        paid,
        due_date || null,
        feeStatus,
        remarks || null,
      ]
    );

    return NextResponse.json(
      { fee: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Fees POST error:", error);

    return NextResponse.json(
      { error: "Failed to create fee record" },
      { status: 500 }
    );
  }
}
