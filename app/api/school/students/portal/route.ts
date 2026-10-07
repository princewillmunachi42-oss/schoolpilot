import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import pool from "@/lib/db";

async function getOwnerSchool(userId: string) {
  const result = await pool.query(
    `
      SELECT school_id
      FROM school_members
      WHERE user_id = $1
        AND role = 'owner'
      LIMIT 1
    `,
    [userId]
  );

  return result.rows[0]?.school_id ?? null;
}

function generateLoginId() {
  const value = crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `SP-STU-${value}`;
}

function generateTemporaryPassword() {
  return crypto.randomBytes(9).toString("base64url");
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const schoolId = await getOwnerSchool(user.id);

  if (!schoolId) {
    return NextResponse.json(
      { success: false, message: "Access denied." },
      { status: 403 }
    );
  }

  let body: {
    studentId?: string;
    action?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  const studentId = String(body.studentId ?? "").trim();
  const action = String(body.action ?? "enable").trim().toLowerCase();

  if (!studentId) {
    return NextResponse.json(
      { success: false, message: "Student ID is required." },
      { status: 400 }
    );
  }

  if (action !== "enable") {
    return NextResponse.json(
      { success: false, message: "Unsupported portal action." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const studentResult = await client.query(
      `
        SELECT
          id,
          school_id,
          user_id,
          admission_number,
          first_name,
          last_name,
          email,
          status,
          portal_enabled
        FROM students
        WHERE id = $1
          AND school_id = $2
        FOR UPDATE
      `,
      [studentId, schoolId]
    );

    const student = studentResult.rows[0];

    if (!student) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        { success: false, message: "Student not found." },
        { status: 404 }
      );
    }

    if (student.status !== "active") {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Only active students can have portal access.",
        },
        { status: 400 }
      );
    }

    if (student.portal_enabled && student.user_id) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "Portal access is already enabled for this student.",
        },
        { status: 409 }
      );
    }

    if (student.user_id) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message:
            "This student is already linked to a user account. Please check the account before enabling portal access.",
        },
        { status: 409 }
      );
    }

    let loginId = generateLoginId();

    for (let attempt = 0; attempt < 5; attempt++) {
      const existingLogin = await client.query(
        `
          SELECT id
          FROM users
          WHERE LOWER(login_id) = LOWER($1)
          LIMIT 1
        `,
        [loginId]
      );

      if (existingLogin.rowCount === 0) {
        break;
      }

      loginId = generateLoginId();

      if (attempt === 4) {
        throw new Error("Unable to generate a unique student login ID.");
      }
    }

    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);
     let portalEmail: string | null = null;

if (student.email) {
  const existingEmail = await client.query(
    `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1
    `,
    [student.email]
  );

  if (existingEmail.rowCount === 0) {
    portalEmail = student.email;
  }
}
    const userResult = await client.query(
      `
        INSERT INTO users (
          email,
          login_id,
          password_hash,
          first_name,
          last_name,
          email_verified,
          status
        )
        VALUES (
          NULLIF($1, ''),
          $2,
          $3,
          $4,
          $5,
          FALSE,
          'active'
        )
        RETURNING id
      `,
     [
  portalEmail ?? "",
  loginId,
  passwordHash,
  student.first_name,
  student.last_name,
]
    );

    const studentUserId = userResult.rows[0].id;

    await client.query(
      `
        INSERT INTO school_members (
          school_id,
          user_id,
          role
        )
        VALUES ($1, $2, 'student')
      `,
      [schoolId, studentUserId]
    );

    await client.query(
      `
        UPDATE students
        SET
          user_id = $1,
          portal_enabled = TRUE,
          updated_at = NOW()
        WHERE id = $2
          AND school_id = $3
      `,
      [studentUserId, studentId, schoolId]
    );

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Student portal access enabled.",
      credentials: {
        loginId,
        temporaryPassword,
      },
    });
  } catch (error: unknown) {
    await client.query("ROLLBACK");

const pgError = error as {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
  column?: string;
};

if (pgError.code === "23505") {
  console.error("Student portal unique constraint error:", {
    code: pgError.code,
    constraint: pgError.constraint,
    detail: pgError.detail,
    table: pgError.table,
    column: pgError.column,
  });

  return NextResponse.json(
    {
      success: false,
      message: `Portal account conflict: ${
        pgError.constraint ?? "unknown unique constraint"
      }.`,
    },
    { status: 409 }
  );
}
    console.error("Enable student portal error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to enable student portal access.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
