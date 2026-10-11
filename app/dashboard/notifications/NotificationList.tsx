"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Clock3,
  Check,
  CheckCheck,
  ChevronRight,
  Info,
} from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string | Date;
};

export default function NotificationList({
  notifications: initialNotifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function markAsRead(id: string) {
    setUpdating(id);
    setError("");

    try {
      const response = await fetch(`/api/school/notifications/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Unable to update this notification. Please try again.");
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
      router.refresh();
    } catch {
      setError("Couldn't update the notification. Please try again.");
    } finally {
      setUpdating(null);
    }
  }

  if (notifications.length === 0) {
    return (
      <section className="rounded-3xl border bg-card px-6 py-14 text-center sm:px-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bell className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">You&apos;re all caught up</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Important school updates and staff attendance alerts will appear here.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Return to Dashboard
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Recent notifications</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Showing up to {notifications.length} recent notifications
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {notifications.map((notification) => {
        const isAttendance = notification.type === "staff_attendance";
        const Icon = isAttendance ? Clock3 : Info;
        const href =
          notification.link?.startsWith("/") &&
          !notification.link.startsWith("//")
            ? notification.link
            : "/dashboard/notifications";

        return (
          <article
            key={notification.id}
            className={`rounded-2xl border bg-card p-4 transition sm:p-5 ${
              !notification.is_read
                ? "border-primary/40 bg-primary/[0.02]"
                : ""
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>

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

                <p className="mt-3 text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(notification.created_at))}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    View details
                    <ChevronRight className="h-4 w-4" />
                  </Link>

                  {!notification.is_read && (
                    <button
                      type="button"
                      disabled={updating === notification.id}
                      onClick={() => void markAsRead(notification.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {updating === notification.id
                        ? "Updating..."
                        : "Mark as read"}
                    </button>
                  )}

                  {notification.is_read && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CheckCheck className="h-3.5 w-3.5" />
                      Read
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
