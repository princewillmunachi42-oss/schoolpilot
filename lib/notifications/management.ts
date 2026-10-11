import pool from "@/lib/db";

type ManagementNotificationInput = {
  schoolId: string;
  title: string;
  message: string;
  type: "announcement" | "fee" | "staff_attendance" | "staff" | "academic_session" | "general";
  link: string;
};

export async function notifySchoolManagement({
  schoolId,
  title,
  message,
  type,
  link,
}: ManagementNotificationInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO notifications
         (school_id, user_id, title, message, type, link)
       SELECT $1, sm.user_id, $2, $3, $4, $5
       FROM school_members sm
       INNER JOIN users u ON u.id = sm.user_id
       WHERE sm.school_id = $1
         AND sm.role IN ('owner', 'principal', 'admin')
         AND u.status = 'active'`,
      [schoolId, title, message, type, link]
    );
  } catch (error) {
    console.error("Management notification delivery failed:", error);
  }
}
