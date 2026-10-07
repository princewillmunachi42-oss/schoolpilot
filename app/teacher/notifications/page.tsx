import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle2,
  Megaphone,
  MessageSquare,
  Info,
} from "lucide-react";
import { getCurrentTeacher } from "@/lib/auth/teacher";
import pool from "@/lib/db";

function getNotificationIcon(type: string | null) {
  switch (type) {
    case "announcement":
      return Megaphone;
    case "message":
      return MessageSquare;
    case "success":
      return CheckCircle2;
    default:
      return Info;
  }
}

function getNotificationTone(type: string | null) {
  switch (type) {
    case "announcement":
      return "bg-primary/10 text-primary";
    case "message":
      return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400";
    case "success":
      return "bg-success/10 text-success";
    default:
      return "bg-muted text-muted-foreground";
  }
}

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
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/teacher"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Dashboard
        </Link>

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Bell className="h-3.5 w-3.5" />
              Teacher Portal
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Notifications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Keep track of important school messages, updates, and announcements.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Notifications
              </p>
              <p className="text-lg font-bold">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-3xl border bg-card p-10 text-center shadow-sm sm:p-14">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              You're all caught up
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              New school notifications and important updates will appear here.
            </p>

            <Link
              href="/teacher"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              Return to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type);
              const tone = getNotificationTone(notification.type);

              return (
                <Link
                  key={notification.id}
                  href={notification.link || "/teacher/notifications"}
                  className="group block rounded-3xl border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-semibold leading-6 group-hover:text-primary sm:text-lg">
                              {notification.title}
                            </h2>

                            {!notification.is_read && (
                              <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-white">
                                New
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>

                        <ArrowRight className="hidden h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary sm:block" />
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {new Intl.DateTimeFormat("en-NG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(notification.created_at))}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
