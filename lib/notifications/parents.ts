import pool from "@/lib/db";

type ParentNotificationInput = {
  schoolId: string;
  studentId: string;
  title: string;
  message: string;
  type: string;
  link: string;
};

export async function notifyParentsAboutStudentEvent({
  schoolId,
  studentId,
  title,
  message,
  type,
  link,
}: ParentNotificationInput) {
  const result = await pool.query(
    `
      SELECT DISTINCT p.user_id
      FROM parent_students ps
      INNER JOIN parents p
        ON p.id = ps.parent_id
       AND p.school_id = ps.school_id
      INNER JOIN users u
        ON u.id = p.user_id
      WHERE ps.school_id = $1
        AND ps.student_id = $2
        AND p.status = 'active'
        AND p.user_id IS NOT NULL
        AND u.status = 'active'
    `,
    [schoolId, studentId]
  );

  if (result.rows.length === 0) {
    return;
  }

  const values: string[] = [];
  const params: string[] = [];

  result.rows.forEach((parent, index) => {
    const offset = index * 6;

    values.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
    );

    params.push(
      schoolId,
      parent.user_id,
      title,
      message,
      type,
      link
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

type ParentAnnouncementInput = {
  schoolId: string;
  title: string;
  audience: "all" | "parents" | "students" | "teachers";
};

export async function notifyParentsAboutAnnouncement({
  schoolId,
  title,
  audience,
}: ParentAnnouncementInput) {
  if (audience !== "all" && audience !== "parents") {
    return;
  }

  const result = await pool.query(
    `
      SELECT DISTINCT p.user_id
      FROM parents p
      INNER JOIN users u
        ON u.id = p.user_id
      WHERE p.school_id = $1
        AND p.status = 'active'
        AND p.user_id IS NOT NULL
        AND u.status = 'active'
    `,
    [schoolId]
  );

  if (result.rows.length === 0) {
    return;
  }

  const values: string[] = [];
  const params: string[] = [];

  result.rows.forEach((parent, index) => {
    const offset = index * 6;

    values.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`
    );

    params.push(
      schoolId,
      parent.user_id,
      `New announcement: ${title}`,
      `Your school has published a new announcement: ${title}.`,
      "announcement",
      `/parent/communications`
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
