import pool from "@/lib/db";

type AnnouncementNotificationInput = {
  schoolId: string;
  announcementId: string;
  title: string;
  audience: "all" | "students";
};

export async function notifyStudentsAboutAnnouncement({
  schoolId,
  announcementId,
  title,
  audience,
}: AnnouncementNotificationInput) {
  const result = await pool.query(
    `
      SELECT DISTINCT st.user_id
      FROM students st
      INNER JOIN school_members sm
        ON sm.user_id = st.user_id
       AND sm.school_id = st.school_id
       AND sm.role = 'student'
      INNER JOIN users u
        ON u.id = st.user_id
      WHERE st.school_id = $1
        AND st.portal_enabled = TRUE
        AND st.status = 'active'
        AND st.user_id IS NOT NULL
        AND u.status = 'active'
        AND $2 = ANY(ARRAY['all', 'students'])
    `,
    [schoolId, audience]
  );

  if (result.rows.length === 0) {
    return;
  }

  const values: string[] = [];
  const params: string[] = [];

  result.rows.forEach((student, index) => {
    const offset = index * 6;

    values.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
    );

    params.push(
      schoolId,
      student.user_id,
      `New announcement: ${title}`,
      `Your school has published a new announcement: ${title}.`,
      "announcement",
      `/student/announcements`
    );
  });

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
      VALUES ${values.join(", ")}
    `,
    params
  );
}
