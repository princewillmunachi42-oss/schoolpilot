import pool from "@/lib/db";

type TeacherAnnouncementNotificationInput = {
  schoolId: string;
  announcementId: string;
  title: string;
  audience: "all" | "teachers";
};

export async function notifyTeachersAboutAnnouncement({
  schoolId,
  announcementId,
  title,
  audience,
}: TeacherAnnouncementNotificationInput) {
  if (audience !== "all" && audience !== "teachers") {
    return;
  }

  const result = await pool.query(
    `
      SELECT DISTINCT st.user_id
      FROM staff st
      INNER JOIN school_members sm
        ON sm.user_id = st.user_id
       AND sm.school_id = st.school_id
       AND sm.role = 'teacher'
      INNER JOIN users u
        ON u.id = st.user_id
      WHERE st.school_id = $1
        AND st.user_id IS NOT NULL
        AND u.status = 'active'
    `,
    [schoolId]
  );

  if (result.rows.length === 0) {
    return;
  }

  const values: string[] = [];
  const params: string[] = [];

  result.rows.forEach((teacher, index) => {
    const offset = index * 6;

    values.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
    );

    params.push(
      schoolId,
      teacher.user_id,
      `New announcement: ${title}`,
      `Your school has published a new announcement: ${title}.`,
      "announcement",
      `/teacher/announcements`
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
