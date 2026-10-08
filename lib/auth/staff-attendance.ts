import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function getStaffAttendanceManager() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        sm.school_id,
        sm.role
      FROM school_members sm
      WHERE sm.user_id = $1
        AND sm.role IN ('owner', 'principal', 'admin')
      ORDER BY
        CASE sm.role
          WHEN 'owner' THEN 1
          WHEN 'principal' THEN 2
          WHEN 'admin' THEN 3
          ELSE 4
        END
      LIMIT 1
    `,
    [user.id]
  );

  const membership = result.rows[0];

  if (!membership) {
    return null;
  }

  return {
    userId: user.id,
    schoolId: membership.school_id,
    role: membership.role,
    user,
  };
}

export async function getCurrentStaffAttendanceUser() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        sm.school_id,
        sm.role,
        s.id AS staff_id,
        s.staff_id AS staff_number,
        s.first_name,
        s.last_name,
        s.other_name,
        s.email,
        s.phone,
        s.role_title,
        s.photo_url,
        s.status
      FROM school_members sm
      INNER JOIN staff s
        ON s.school_id = sm.school_id
       AND s.user_id = sm.user_id
      WHERE sm.user_id = $1
        AND sm.role = 'teacher'
        AND s.status = 'active'
      LIMIT 1
    `,
    [user.id]
  );

  const staff = result.rows[0];

  if (!staff) {
    return null;
  }

  return {
    userId: user.id,
    schoolId: staff.school_id,
    role: staff.role,
    staffId: staff.staff_id,
    staffNumber: staff.staff_number,
    staff,
    user,
  };
}
