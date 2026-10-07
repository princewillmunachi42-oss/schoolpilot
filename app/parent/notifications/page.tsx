"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Info,
  Megaphone,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
};

type ApiResponse = {
  notifications: Notification[];
  unreadCount: number;
  error?: string;
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getNotificationIcon(type: string) {
  const normalized = type.toLowerCase();

  if (
    normalized.includes("announcement") ||
    normalized.includes("school")
  ) {
    return Megaphone;
  }

  if (
    normalized.includes("alert") ||
    normalized.includes("warning")
  ) {
    return ShieldAlert;
  }

  if (
    normalized.includes("success") ||
    normalized.includes("complete")
  ) {
    return CheckCheck;
  }

  return Bell;
}

export default function ParentNotificationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/parent/notifications",
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load notifications.",
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id: string) {
    try {
      const response = await fetch(
        "/api/parent/notifications/read",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationId: id,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to mark notification as read.",
        );
      }

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notification.",
      );
    }
  }

  async function markAllAsRead() {
    try {
      const response = await fetch(
        "/api/parent/notifications/read",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            markAll: true,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to mark notifications as read.",
        );
      }

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notifications.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Hero */}
        <header className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="relative p-5 sm:p-7">
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[var(--accent)] opacity-10 blur-3xl" />

            <div className="relative">
              <Link
                href="/parent"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition hover:opacity-80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Parent Dashboard
              </Link>

              <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                    <Bell className="h-3.5 w-3.5" />
                    Parent Portal
                  </div>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Notifications
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                    Stay up to date with important messages and
                    updates connected to your parent account.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={loadNotifications}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        loading ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </button>

                  {data && data.unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--destructive)]" />

              <div>
                <p className="text-sm font-semibold text-[var(--destructive)]">
                  Something went wrong
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <RefreshCw className="h-5 w-5 animate-spin text-[var(--primary)]" />
              </div>

              <div>
                <p className="font-semibold">
                  Loading notifications
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Fetching your latest school updates...
                </p>
              </div>
            </div>
          </section>
        ) : !data ? (
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <Bell className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />

            <p className="mt-4 font-semibold">
              Unable to load notifications
            </p>

            <button
              type="button"
              onClick={loadNotifications}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </section>
        ) : (
          <>
            {/* Summary */}
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                    <Bell className="h-5 w-5 text-[var(--primary)]" />
                  </div>

                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                    All updates
                  </span>
                </div>

                <p className="mt-5 text-3xl font-bold">
                  {data.notifications.length}
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Total notifications
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                    <Sparkles className="h-5 w-5 text-[var(--primary)]" />
                  </div>

                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                    Needs attention
                  </span>
                </div>

                <p className="mt-5 text-3xl font-bold">
                  {data.unreadCount}
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Unread notifications
                </p>
              </div>
            </section>

            {/* Notification List */}
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                    <Bell className="h-5 w-5 text-[var(--primary)]" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">
                      School Notifications
                    </h2>

                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Updates and messages connected to your
                      parent account.
                    </p>
                  </div>
                </div>

                {data.unreadCount > 0 && (
                  <span className="inline-flex w-fit rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-bold text-[var(--primary)]">
                    {data.unreadCount} unread
                  </span>
                )}
              </div>

              {data.notifications.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 p-10 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--card)]">
                    <CheckCheck className="h-7 w-7 text-[var(--success)]" />
                  </div>

                  <h3 className="mt-4 font-bold">
                    You&apos;re all caught up
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
                    New school notifications will appear here
                    when they are sent to your account.
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {data.notifications.map((notification) => {
                    const Icon = getNotificationIcon(
                      notification.type,
                    );

                    return (
                      <article
                        key={notification.id}
                        className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm sm:p-5 ${
                          notification.is_read
                            ? "border-[var(--border)] bg-[var(--card)]"
                            : "border-[var(--primary)]/25 bg-[var(--primary)]/5"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              notification.is_read
                                ? "bg-[var(--muted)]"
                                : "bg-[var(--primary)]/10"
                            }`}
                          >
                            <Icon
                              className={`h-5 w-5 ${
                                notification.is_read
                                  ? "text-[var(--muted-foreground)]"
                                  : "text-[var(--primary)]"
                              }`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-base font-bold">
                                    {notification.title}
                                  </h3>

                                  {!notification.is_read && (
                                    <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                      Unread
                                    </span>
                                  )}
                                </div>

                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">
                                  {notification.message}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                                <ClockIcon />
                                {formatDate(
                                  notification.created_at,
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
                              <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide">
                                {formatType(
                                  notification.type,
                                )}
                              </span>

                              <div className="ml-auto flex flex-wrap gap-2">
                                {notification.link && (
                                  <Link
                                    href={notification.link}
                                    onClick={() => {
                                      if (
                                        !notification.is_read
                                      ) {
                                        void markAsRead(
                                          notification.id,
                                        );
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--muted)]"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View
                                  </Link>
                                )}

                                {!notification.is_read && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      markAsRead(
                                        notification.id,
                                      )
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Mark read
                                  </button>
                                )}

                                {notification.is_read && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-medium text-[var(--muted-foreground)]">
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Read
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7v5l3 2"
      />
    </svg>
  );
}
