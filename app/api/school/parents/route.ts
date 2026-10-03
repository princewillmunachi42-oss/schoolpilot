import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import pool from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const membershipResult = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership || membership.role !== "owner") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const formData = await request.formData();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!fullName) {
    return NextResponse.json(
      {
        success: false,
        message: "Full name is required.",
      },
      { status: 400 }
    );
  }

  if (fullName.length > 200) {
    return NextResponse.json(
      {
        success: false,
        message: "Full name must be 200 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (!email) {
    return NextResponse.json(
      {
        success: false,
        message: "Email is required for a parent login account.",
      },
      { status: 400 }
    );
  }

  if (email.length > 255) {
    return NextResponse.json(
      {
        success: false,
        message: "Email must be 255 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      {
        success: false,
        message: "Parent login password must be at least 8 characters.",
      },
      { status: 400 }
    );
  }

  if (phone.length > 30) {
    return NextResponse.json(
      {
        success: false,
        message: "Phone must be 30 characters or fewer.",
      },
      { status: 400 }
    );
  }

  if (!["active", "inactive"].includes(status)) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid parent status.",
      },
      { status: 400 }
    );
  }

  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || fullName;
  const lastName = nameParts.slice(1).join(" ") || firstName;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUserResult = await client.query(
      `SELECT id
       FROM users
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      await client.query("ROLLBACK");

      return NextResponse.json(
        {
          success: false,
          message: "A user account with this email already exists.",
        },
        { status: 409 }
      );
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

    const userId = newUserResult.rows[0].id;

    await client.query(
      `INSERT INTO school_members (
         school_id,
         user_id,
         role
       )
       VALUES ($1, $2, 'parent')`,
      [membership.school_id, userId]
    );

    await client.query(
      `INSERT INTO parents (
         school_id,
         user_id,
         full_name,
         email,
         phone,
         address,
         status
       )
       VALUES (
         $1,
         $2,
         $3,
         NULLIF($4, ''),
         NULLIF($5, ''),
         NULLIF($6, ''),
         $7
       )`,
      [
        membership.school_id,
        userId,
        fullName,
        email,
        phone,
        address,
        status,
      ]
    );

    await client.query("COMMIT");
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("Create parent error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create parent account.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }

  return NextResponse.redirect(
    new URL("/dashboard/parents?created=1", request.url)
  );
}


    
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  const membershipResult = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      {
        success: false,
        message: "Forbidden.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const parentId = String(body.parentId ?? "").trim();

    if (!parentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent ID is required.",
        },
        { status: 400 }
      );
    }

    const deleteResult = await pool.query(
      `DELETE FROM parents
       WHERE id = $1
         AND school_id = $2
       RETURNING id, full_name`,
      [parentId, membership.school_id]
    );

    if (deleteResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Parent deleted successfully.",
      parent: deleteResult.rows[0],
    });
  } catch (error) {
    console.error("Delete parent error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to delete parent.",
      },
      { status: 500 }
    );
  }
}
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  const membershipResult = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      {
        success: false,
        message: "Forbidden.",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    const parentId = String(body.parentId ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const address = String(body.address ?? "").trim();
    const status = String(body.status ?? "").trim();

    if (!parentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent ID is required.",
        },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (fullName.length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name must be 200 characters or fewer.",
        },
        { status: 400 }
      );
    }

    if (email.length > 255) {
      return NextResponse.json(
        {
          success: false,
          message: "Email must be 255 characters or fewer.",
        },
        { status: 400 }
      );
    }

    if (phone.length > 30) {
      return NextResponse.json(
        {
          success: false,
          message: "Phone must be 30 characters or fewer.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid parent status.",
        },
        { status: 400 }
      );
    }

    const updateResult = await pool.query(
      `UPDATE parents
       SET
         full_name = $1,
         email = NULLIF($2, ''),
         phone = NULLIF($3, ''),
         address = NULLIF($4, ''),
         status = $5,
         updated_at = NOW()
       WHERE id = $6
         AND school_id = $7
       RETURNING
         id,
         full_name,
         email,
         phone,
         address,
         status`,
      [
        fullName,
        email,
        phone,
        address,
        status,
        parentId,
        membership.school_id,
      ]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Parent not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Parent updated successfully.",
      parent: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Update parent error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update parent.",
      },
      { status: 500 }
    );
  }
}
