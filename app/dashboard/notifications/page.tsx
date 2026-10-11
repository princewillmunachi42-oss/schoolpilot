import Link from "next/link";
import { Bell, ArrowLeft, CheckCheck } from "lucide-react";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getStaffAttendanceManager } from "@/lib/auth/staff-attendance";
import NotificationList from "./NotificationList";

export const dynamic = "force-dynamic";

export default async function ManagementNotificationsPage() {
  const manager = await getStaffAttendanceManager();

  if (!manager) {
    redirect("/login");
  }

  const [notificationsResult, unreadResult] = await Promise.all([
    pool.query(
      `SELECT id, title, message, type, link, is_read, created_at
       FROM notifications
       WHERE school_id = $1 AND user_id = $2
       ORDER BY created_at DESC
       LIMIT 100`,
      [manager.schoolId, manager.userId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE school_id = $1
         AND user_id = $2
         AND is_read = FALSE`,
      [manager.schoolId, manager.userId]
    ),
  ]);

  const notifications = notificationsResult.rows;
  const unreadCount = unreadResult.rows[0]?.count ?? 0;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <section className="mb-8 overflow-hidden rounded-3xl border bg-card">
        <div className="relative p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bell className="h-6 w-6" />
              </div>

              <p className="text-sm font-semibold text-primary">
                School Management
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Notifications
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Keep track of staff attendance and important school updates.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border bg-background px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CheckCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unread</p>
                <p className="text-xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NotificationList notifications={notifications} />
    </main>
  );
}
