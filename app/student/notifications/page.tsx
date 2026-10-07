import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Inbox,
  MessageSquare,
  Megaphone,
  ClipboardList,
  Info,
  CheckCircle2,
} from "lucide-react";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";

function getNotificationIcon(type: string) {
  switch (type) {
    case "assignment":
      return ClipboardList;
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

function getNotificationIconStyle(type: string) {
  switch (type) {
    case "assignment":
      return "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
    case "announcement":
      return "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400";
    case "message":
      return "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400";
    case "success":
      return "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default async function StudentNotificationsPage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

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
    [currentStudent.schoolId, currentStudent.userId]
  );

  const notifications = result.rows;
  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Back */}
      <Link
        href="/student"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Student Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8 overflow-hidden rounded-3xl border bg-card">
        <div className="relative p-6 sm:p-8">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>

              <p className="text-sm font-semibold text-primary">
                Student Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Notifications
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Stay updated with important school messages, assignments,
                announcements, and other activities.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border bg-background px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Inbox className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Unread
                </p>
                <p className="text-lg font-bold">
                  {unreadCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <div className="rounded-3xl border bg-card px-6 py-14 text-center sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            You're all caught up
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            You don't have any school notifications yet. New messages and
            important updates will appear here.
          </p>

          <Link
            href="/student"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
          >
            Return to Dashboard
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Recent notifications
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {notifications.length}{" "}
                {notifications.length === 1
                  ? "notification"
                  : "notifications"}
              </p>
            </div>
          </div>

          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconStyle = getNotificationIconStyle(notification.type);

            return (
              <Link
                key={notification.id}
                href={`/student/notifications/${notification.id}`}
                className={`group block rounded-2xl border bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-5 ${
                  !notification.is_read
                    ? "border-primary/40 bg-primary/[0.02]"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold leading-6">
                        {notification.title}
                      </h3>

                      {!notification.is_read && (
                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {notification.message}
                    </p>

                    <p className="mt-3 text-xs font-medium text-muted-foreground">
                      {new Intl.DateTimeFormat("en-NG", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(notification.created_at))}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
