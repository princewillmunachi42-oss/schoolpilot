import crypto from "crypto";
import { NextRequest } from "next/server";
import pool from "@/lib/db";

const MOBILE_SESSION_DURATION_DAYS = 7;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createMobileSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(
    Date.now() + MOBILE_SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000
  );

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );

  return { token, expiresAt };
}

export async function getMobileUser(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer ([a-f0-9]{64})$/i);

  if (!match) return null;

  const tokenHash = hashToken(match[1]);

  const result = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.first_name,
       u.last_name,
       u.phone,
       u.email_verified,
       u.status,
       s.id AS session_id
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
       AND s.expires_at > NOW()
       AND u.status = 'active'
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0] ?? null;
}

export async function revokeMobileSession(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer ([a-f0-9]{64})$/i);

  if (!match) return false;

  await pool.query(
    `DELETE FROM sessions WHERE token_hash = $1`,
    [hashToken(match[1])]
  );

  return true;
}
