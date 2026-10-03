import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function getCurrentParent() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const result = await pool.query(
    `SELECT
       p.id,
       p.school_id,
       p.user_id,
       p.full_name,
       p.email,
       p.phone,
       p.address,
       p.photo_url,
       p.status
     FROM parents p
     WHERE p.user_id = $1
       AND p.status = 'active'
     LIMIT 1`,
    [user.id]
  );

  const parent = result.rows[0];

  if (!parent) {
    return null;
  }

  return {
    userId: user.id,
    schoolId: parent.school_id,
    parentId: parent.id,
    parent,
    user,
  };
}
