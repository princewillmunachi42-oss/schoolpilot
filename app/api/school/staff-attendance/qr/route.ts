import { NextResponse } from "next/server";
import crypto from "crypto";
import pool from "@/lib/db";
import { getStaffAttendanceManager } from "@/lib/auth/staff-attendance";

const QR_TTL_SECONDS = 60;

export async function POST() {
  const manager = await getStaffAttendanceManager();

  if (!manager) {
    return NextResponse.json(
      {
        success: false,
        message: "You are not authorized to generate staff attendance QR codes.",
      },
      { status: 403 }
    );
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        DELETE FROM staff_attendance_qr_sessions
        WHERE school_id = $1
          AND expires_at < NOW() - INTERVAL '7 days'
      `,
      [manager.schoolId]
    );

    const result = await client.query(
      `
        INSERT INTO staff_attendance_qr_sessions (
          school_id,
          token_hash,
          expires_at,
          created_by
        )
        VALUES (
          $1,
          $2,
          NOW() + INTERVAL '60 seconds',
          $3
        )
        RETURNING id, expires_at, created_at
      `,
      [manager.schoolId, tokenHash, manager.userId]
    );

    await client.query("COMMIT");

    const session = result.rows[0];

    return NextResponse.json({
      success: true,
      qr: {
        token: rawToken,
        sessionId: session.id,
        expiresAt: session.expires_at,
        createdAt: session.created_at,
        expiresInSeconds: QR_TTL_SECONDS,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Staff attendance QR generation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to generate a staff attendance QR code.",
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
