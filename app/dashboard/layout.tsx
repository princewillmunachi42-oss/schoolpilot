import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import pool from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const result = await pool.query(
    `
      SELECT role
      FROM school_members
      WHERE user_id = $1
      LIMIT 1
    `,
    [user.id]
  );

  const membership = result.rows[0];

  if (!membership) {
    redirect("/login");
  }

  if (membership.role === "teacher") {
    redirect("/teacher");
  }

  return children;
}
