import pool from "@/lib/db";

type FeeNotificationInput = {
  schoolId: string;
  studentId: string;
  feeId: string;
  feeName: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  sessionName: string;
  termName: string;
};

function formatCurrency(value: number) {
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export async function notifyStudentAboutFee({
  schoolId,
  studentId,
  feeId,
  feeName,
  amountDue,
  amountPaid,
  status,
  sessionName,
  termName,
}: FeeNotificationInput) {
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

  const balance = Math.max(amountDue - amountPaid, 0);

  const message =
    status === "paid"
      ? `Your ${feeName} fee for ${termName}, ${sessionName} has been fully paid.`
      : `A ${feeName} fee of ${formatCurrency(
          amountDue
        )} has been added to your account. Outstanding balance: ${formatCurrency(
          balance
        )}.`;

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
        'fee',
        $5
      )
    `,
    [
      schoolId,
      user.user_id,
      `New fee: ${feeName}`,
      message,
      `/student/fees`,
    ]
  );
}
