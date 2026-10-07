import pool from "@/lib/db";

type ResultNotificationInput = {
  schoolId: string;
  studentId: string;
  resultId: string;
  subjectName: string;
  sessionName: string;
  termName: string;
};

export async function notifyStudentAboutResult({
  schoolId,
  studentId,
  resultId,
  subjectName,
  sessionName,
  termName,
}: ResultNotificationInput) {
  const result = await pool.query(
    `
      SELECT st.user_id
      FROM students st
      INNER JOIN school_members sm
        ON sm.user_id = st.user_id
       AND sm.school_id = st.school_id
       AND sm.role = 'student'
      INNER JOIN users u
        ON u.id = st.user_id
      WHERE st.id = $1
        AND st.school_id = $2
        AND st.portal_enabled = TRUE
        AND st.status = 'active'
        AND st.user_id IS NOT NULL
        AND u.status = 'active'
      LIMIT 1
    `,
    [studentId, schoolId]
  );

  const user = result.rows[0];

  if (!user?.user_id) {
    return;
  }

  await pool.query(
    `
      INSERT INTO notifications (
        school_id,
        user_id,
        title,
        message,
        type,
        link
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'result',
        $5
      )
    `,
    [
      schoolId,
      user.user_id,
      `New ${subjectName} result`,
      `Your ${subjectName} result for ${termName}, ${sessionName} is now available.`,
      `/student/results`,
    ]
  );
}
