import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export async function getCurrentStudent() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const result = await pool.query(
    `
      SELECT
        sm.school_id,
        sm.role,
        st.id AS student_id,
        st.user_id,
        st.admission_number,
        st.first_name,
        st.last_name,
        st.other_name,
        st.gender,
        st.date_of_birth,
        st.email,
        st.phone,
        st.photo_url,
        st.status,
        st.class_id,
        st.portal_enabled
      FROM school_members sm
      JOIN students st
        ON st.user_id = sm.user_id
       AND st.school_id = sm.school_id
      WHERE sm.user_id = $1
        AND sm.role = 'student'
        AND st.portal_enabled = TRUE
        AND st.status = 'active'
      LIMIT 1
    `,
    [user.id]
  );

  const student = result.rows[0];

  if (!student) {
    return null;
  }

  return {
    userId: user.id,
    schoolId: student.school_id,
    studentId: student.student_id,
    student,
    user,
  };
}
