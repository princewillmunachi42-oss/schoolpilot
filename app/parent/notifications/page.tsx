"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  return new Date(date).toLocaleString();
}

export default function ParentNotificationsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/parent/notifications", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to load notifications."
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load notifications."
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
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to mark notification as read."
        );
      }

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notification."
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
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Failed to mark notifications as read."
        );
      }

      await loadNotifications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notifications."
      );
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        <header className="rounded-2xl border bg-white p-5 shadow-sm">
          <Link
            href="/parent"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Parent Dashboard
          </Link>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Parent Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Notifications
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Important updates and messages from your school.
              </p>
            </div>

            {data && data.unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Mark all as read
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Loading notifications...
            </p>
          </section>
        ) : !data ? (
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">
              Unable to load notifications.
            </p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Total Notifications
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {data.notifications.length}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-500">
                  Unread Notifications
                </p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {data.unreadCount}
                </p>
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  School Notifications
                </h2>

                <p className="text-sm text-gray-500">
                  Updates and messages connected to your parent account.
                </p>
              </div>

              {data.notifications.length === 0 ? (
                <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
                  <h3 className="font-semibold text-gray-900">
                    No notifications
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    You&apos;re all caught up. New school
                    notifications will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.notifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm ${
                        notification.is_read
                          ? ""
                          : "border-blue-300"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {notification.title}
                            </h3>

                            {!notification.is_read && (
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                                Unread
                              </span>
                            )}
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                            {notification.message}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1">
                              {notification.type}
                            </span>

                            <span>
                              {formatDate(notification.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          {notification.link && (
                            <Link
                              href={notification.link}
                              onClick={() => {
                                if (!notification.is_read) {
                                  void markAsRead(notification.id);
                                }
                              }}
                              className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              View
                            </Link>
                          )}

                          {!notification.is_read && (
                            <button
                              type="button"
                              onClick={() =>
                                markAsRead(notification.id)
                              }
                              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
