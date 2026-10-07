import pool from "@/lib/db";

type AssignmentNotificationInput = {
  schoolId: string;
  assignmentId: string;
  classId: string;
  title: string;
  subjectName: string;
};

export async function notifyStudentsAboutAssignment({
  schoolId,
  assignmentId,
  classId,
  title,
  subjectName,
}: AssignmentNotificationInput) {
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
      SELECT
        $1,
        st.user_id,
        $2,
        $3,
        'assignment',
        $4
      FROM students st
      INNER JOIN school_members sm
        ON sm.user_id = st.user_id
       AND sm.school_id = st.school_id
       AND sm.role = 'student'
      INNER JOIN users u
        ON u.id = st.user_id
      WHERE st.school_id = $1
        AND st.class_id = $5
        AND st.portal_enabled = TRUE
        AND st.status = 'active'
        AND st.user_id IS NOT NULL
        AND u.status = 'active'
    `,
    [
      schoolId,
      `New assignment: ${title}`,
      `A new ${subjectName} assignment has been published for your class.`,
      `/student/assignments/${assignmentId}`,
      classId,
    ]
  );
}
