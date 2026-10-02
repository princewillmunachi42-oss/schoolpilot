import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";

async function getOwnerSchool(userId: string) {
  const result = await pool.query(
    `SELECT school_id
     FROM school_members
     WHERE user_id = $1
       AND role = 'owner'
     LIMIT 1`,
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

  const membership = await getOwnerSchool(user.id);

  if (!membership) {
    return NextResponse.json(
      { success: false, message: "School membership not found." },
      { status: 403 }
    );
  }

  const result = await pool.query(
    `SELECT
       id,
       staff_id,
       first_name,
       last_name,
       other_name,
       email,
       phone,
       role_title,
       photo_url,
       status
     FROM staff
     WHERE school_id = $1
     ORDER BY first_name ASC, last_name ASC`,
    [membership.school_id]
  );

  return NextResponse.json({
    success: true,
    staff: result.rows,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();

  const staffId = String(formData.get("staffId") ?? "")
    .trim()
    .toUpperCase();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const otherName = String(formData.get("otherName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const roleTitle = String(formData.get("roleTitle") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!staffId || !firstName || !lastName) {
    return NextResponse.json(
      {
        success: false,
        message: "Staff ID, first name and last name are required.",
      },
      { status: 400 }
    );
  }

  if (status !== "active" && status !== "inactive") {
    return NextResponse.json(
      { success: false, message: "Invalid staff status." },
      { status: 400 }
    );
  }

  if (staffId.length > 50) {
    return NextResponse.json(
      { success: false, message: "Staff ID must be 50 characters or fewer." },
      { status: 400 }
    );
  }

  if (firstName.length > 100 || lastName.length > 100) {
    return NextResponse.json(
      {
        success: false,
        message: "First name and last name must be 100 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (email && !password) {
    return NextResponse.json(
      {
        success: false,
        message: "A login password is required when an email is provided.",
      },
      { status: 400 }
    );
  }

  if (password && !email) {
    return NextResponse.json(
      {
        success: false,
        message: "An email is required when creating a login account.",
      },
      { status: 400 }
    );
  }

  if (password && password.length < 8) {
    return NextResponse.json(
      {
        success: false,
        message: "Teacher login password must be at least 8 characters.",
      },
      { status: 400 }
    );
  }

  const membership = await getOwnerSchool(user.id);

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can manage staff.",
      },
      { status: 403 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let userId: string | null = null;

    if (email && password) {
      const existingUserResult = await client.query(
        `SELECT id
         FROM users
         WHERE lower(email) = lower($1)
         LIMIT 1`,
        [email]
      );

      if (existingUserResult.rows.length > 0) {
        throw new Error("EMAIL_ALREADY_EXISTS");
      }

      const passwordHash = await hashPassword(password);

      const newUserResult = await client.query(
        `INSERT INTO users (
           email,
           password_hash,
           first_name,
           last_name,
           phone,
           email_verified,
           status
         )
         VALUES ($1, $2, $3, $4, $5, FALSE, $6)
         RETURNING id`,
        [
          email,
          passwordHash,
          firstName,
          lastName,
          phone || null,
          status === "active" ? "active" : "inactive",
        ]
      );

      userId = newUserResult.rows[0].id;

      await client.query(
        `INSERT INTO school_members (
           school_id,
           user_id,
           role
         )
         VALUES ($1, $2, 'teacher')`,
        [membership.school_id, userId]
      );
    }

    await client.query(
      `INSERT INTO staff (
         school_id,
         user_id,
         staff_id,
         first_name,
         last_name,
         other_name,
         email,
         phone,
         role_title,
         status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        membership.school_id,
        userId,
        staffId,
        firstName,
        lastName,
        otherName || null,
        email || null,
        phone || null,
        roleTitle || null,
        status,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.redirect(
      new URL("/dashboard/staff?created=1", request.url)
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Staff creation error:", error);

    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return NextResponse.json(
        {
          success: false,
          message: "A user account with this email already exists.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to add staff member. The Staff ID may already exist in this school.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const membership = await getOwnerSchool(user.id);

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can manage staff.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const id = String(body.id ?? "").trim();
  const staffId = String(body.staffId ?? "").trim().toUpperCase();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const otherName = String(body.otherName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const roleTitle = String(body.roleTitle ?? "").trim();
  const status = String(body.status ?? "active").trim();

  if (!id || !staffId || !firstName || !lastName) {
    return NextResponse.json(
      {
        success: false,
        message: "Staff ID, first name and last name are required.",
      },
      { status: 400 }
    );
  }

  if (status !== "active" && status !== "inactive") {
    return NextResponse.json(
      { success: false, message: "Invalid staff status." },
      { status: 400 }
    );
  }

  if (staffId.length > 50) {
    return NextResponse.json(
      { success: false, message: "Staff ID must be 50 characters or fewer." },
      { status: 400 }
    );
  }

  if (firstName.length > 100 || lastName.length > 100) {
    return NextResponse.json(
      {
        success: false,
        message: "First name and last name must be 100 characters or fewer.",
      },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingResult = await client.query(
      `SELECT user_id
       FROM staff
       WHERE id = $1
         AND school_id = $2
       LIMIT 1`,
      [id, membership.school_id]
    );

    if (existingResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        { success: false, message: "Staff member not found." },
        { status: 404 }
      );
    }

    const staffUserId = existingResult.rows[0].user_id;

    const duplicateResult = await client.query(
      `SELECT id
       FROM staff
       WHERE school_id = $1
         AND upper(staff_id) = upper($2)
         AND id <> $3
       LIMIT 1`,
      [membership.school_id, staffId, id]
    );

    if (duplicateResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "A staff member with this Staff ID already exists.",
        },
        { status: 409 }
      );
    }

    if (email && staffUserId) {
      const emailUserResult = await client.query(
        `SELECT id
         FROM users
         WHERE lower(email) = lower($1)
           AND id <> $2
         LIMIT 1`,
        [email, staffUserId]
      );

      if (emailUserResult.rows.length > 0) {
        await client.query("ROLLBACK");

        return NextResponse.json(
          {
            success: false,
            message: "A user account with this email already exists.",
          },
          { status: 409 }
        );
      }
    }

    await client.query(
      `UPDATE staff
       SET
         staff_id = $1,
         first_name = $2,
         last_name = $3,
         other_name = $4,
         email = $5,
         phone = $6,
         role_title = $7,
         status = $8,
         updated_at = NOW()
       WHERE id = $9
         AND school_id = $10`,
      [
        staffId,
        firstName,
        lastName,
        otherName || null,
        email || null,
        phone || null,
        roleTitle || null,
        status,
        id,
        membership.school_id,
      ]
    );

    if (staffUserId) {
      await client.query(
        `UPDATE users
         SET
           first_name = $1,
           last_name = $2,
           phone = $3,
           status = $4
         WHERE id = $5`,
        [
          firstName,
          lastName,
          phone || null,
          status === "active" ? "active" : "inactive",
          staffUserId,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Staff member updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Staff update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update staff member.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const membership = await getOwnerSchool(user.id);

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        message: "Only the school owner can manage staff.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Staff ID is required." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `UPDATE staff
       SET
         status = 'inactive',
         updated_at = NOW()
       WHERE id = $1
         AND school_id = $2
       RETURNING user_id`,
      [id, membership.school_id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        { success: false, message: "Staff member not found." },
        { status: 404 }
      );
    }

    const userId = result.rows[0].user_id;

    if (userId) {
      await client.query(
        `UPDATE users
         SET status = 'inactive'
         WHERE id = $1`,
        [userId]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: "Staff member deactivated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Staff deactivation error.");

    return NextResponse.json(
      {
        success: false,
        message: "Unable to deactivate staff member.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
