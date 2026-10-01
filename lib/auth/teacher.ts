import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function getCurrentTeacher() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const membershipResult = await pool.query(
    `
      SELECT
        sm.school_id,
        sm.role
      FROM school_members sm
      WHERE sm.user_id = $1
        AND sm.role = 'teacher'
      LIMIT 1
    `,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership) {
    return null;
  }

  const staffResult = await pool.query(
    `
      SELECT
        id,
        school_id,
        user_id,
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
      WHERE user_id = $1
        AND school_id = $2
        AND status = 'active'
      LIMIT 1
    `,
    [user.id, membership.school_id]
  );

  const staff = staffResult.rows[0];

  if (!staff) {
    return null;
  }

  return {
    userId: user.id,
    schoolId: membership.school_id,
    staffId: staff.id,
    staff,
    user,
  };
}
