import { NextRequest } from "next/server";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await request.json();

    const schoolName = String(body.schoolName ?? "").trim();
    const schoolEmail = String(body.schoolEmail ?? "").trim().toLowerCase();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (
      !schoolName ||
      !schoolEmail ||
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      return Response.json(
        { success: false, message: "All required fields must be provided." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          message: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const existingUser = await client.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
      [email]
    );

    if (existingUser.rowCount) {
      await client.query("ROLLBACK");

      return Response.json(
        { success: false, message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const existingSchool = await client.query(
      `SELECT id FROM schools WHERE LOWER(email) = LOWER($1)`,
      [schoolEmail]
    );

    if (existingSchool.rowCount) {
      await client.query("ROLLBACK");

      return Response.json(
        {
          success: false,
          message: "A school with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const schoolResult = await client.query(
      `INSERT INTO schools (name, email)
       VALUES ($1, $2)
       RETURNING id, name, email`,
      [schoolName, schoolEmail]
    );

    const school = schoolResult.rows[0];

    const userResult = await client.query(
      `INSERT INTO users (
         email,
         password_hash,
         first_name,
         last_name
       )
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, first_name, last_name`,
      [email, passwordHash, firstName, lastName]
    );

    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO school_members (school_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [school.id, user.id]
    );

    await client.query("COMMIT");

    await createSession(user.id);

    return Response.json(
      {
        success: true,
        message: "School account created successfully.",
        school,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Registration error:", error);

    return Response.json(
      {
        success: false,
        message: "Unable to create the school account.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
