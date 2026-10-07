import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTeacher } from "@/lib/auth/teacher";
import pool from "@/lib/db";

export default async function TeacherNotificationsPage() {
  const teacher = await getCurrentTeacher();

  if (!teacher) {
    redirect("/login");
  }
await pool.query(
  `
    UPDATE notifications
    SET is_read = TRUE
    WHERE school_id = $1
      AND user_id = $2
      AND is_read = FALSE
  `,
  [teacher.schoolId, teacher.userId]
);
  const result = await pool.query(
    `
      SELECT
        id,
        title,
        message,
        type,
        link,
        is_read,
        created_at
      FROM notifications
      WHERE school_id = $1
        AND user_id = $2
      ORDER BY created_at DESC
    `,
    [teacher.schoolId, teacher.userId]
  );

  const notifications = result.rows;

  return (
    <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <Link
          href="/teacher"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to Teacher Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Teacher Portal
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Notifications
        </h1>

        <p className="mt-2 text-muted-foreground">
          Stay updated with important school messages.
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            No notifications
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            You don't have any school notifications yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.link || "/teacher/notifications"}
              className={`block rounded-2xl border bg-card p-5 transition hover:bg-muted ${
                !notification.is_read ? "border-primary/40" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">
                      {notification.title}
                    </h2>

                    {!notification.is_read && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        New
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {notification.message}
                  </p>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(notification.created_at))}
                  </p>
                </div>

                <span className="shrink-0 text-sm text-muted-foreground">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
