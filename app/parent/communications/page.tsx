"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  other_name?: string | null;
  admission_number: string;
  class_id?: string | null;
  class_name?: string | null;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  audience: string;
  published_at?: string | null;
  created_at: string;
};

type Assignment = {
  id: string;
  class_id: string;
  subject_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: string;
  created_at: string;
  class_name: string;
  subject_name: string;
  subject_code?: string | null;
  teacher_first_name: string;
  teacher_last_name: string;
};

type Communication = {
  id: string;
  subject: string;
  message: string;
  type: string;
  is_read: boolean;
  student_id?: string | null;
  created_at: string;
  student_first_name?: string | null;
  student_last_name?: string | null;
};

type CommunicationsResponse = {
  success: boolean;
  message?: string;
  children: Child[];
  announcements: Announcement[];
  assignments: Assignment[];
  communications: Communication[];
  unreadCount: number;
};

function formatDate(value?: string | null) {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ParentCommunicationsPage() {
  async function markCommunicationAsRead(communicationId: string) {
    try {
      const response = await fetch("/api/parent/communications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          communicationId,
        }),
      });

      if (!response.ok) {
        return;
      }

      setData((current) => {
        if (!current) return current;

        return {
          ...current,
          communications: current.communications.map((communication) =>
            communication.id === communicationId
              ? { ...communication, is_read: true }
              : communication
          ),
          unreadCount: Math.max(0, current.unreadCount - 1),
        };
      });
    } catch (error) {
      console.error(
        "Failed to mark communication as read:",
        error
      );
    }
  }
  const [data, setData] = useState<CommunicationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCommunications() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/parent/communications", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load communications."
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load communications."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCommunications();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading communications...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900 dark:bg-gray-900">
            <h1 className="text-lg font-semibold">Unable to load communications</h1>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>

            <Link
              href="/parent"
              className="mt-5 inline-flex rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              ← Back to Parent Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href="/parent"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Parent Dashboard
          </Link>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Communications</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Stay connected with your school and keep up with important
                updates for your children.
              </p>
            </div>

            {data.unreadCount > 0 && (
              <div className="w-fit rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {data.unreadCount} unread message
                {data.unreadCount === 1 ? "" : "s"}
              </div>
            )}
          </div>
        </div>

        <section className="mb-6 rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Messages</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Direct messages sent to you by the school.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {data.communications.length}
            </span>
          </div>

          {data.communications.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed p-6 text-center dark:border-gray-700">
              <p className="text-sm font-medium">No messages yet</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                School messages sent directly to you will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.communications.map((communication) => (
                <article
  key={communication.id}
  onClick={() => {
    if (!communication.is_read) {
      markCommunicationAsRead(communication.id);
    }
  }}
  className={`cursor-pointer rounded-xl border p-4 ${
                    communication.is_read
                      ? "bg-white dark:border-gray-700 dark:bg-gray-900"
                      : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {communication.subject}
                        </h3>

                        {!communication.is_read && (
                          <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                            New
                          </span>
                        )}
                      </div>

                      {communication.student_first_name && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Regarding:{" "}
                          {communication.student_first_name}{" "}
                          {communication.student_last_name || ""}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(communication.created_at)}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                    {communication.message}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Announcements</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Important updates from the school.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {data.announcements.length}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {data.announcements.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No announcements available.
                  </p>
                </div>
              ) : (
                data.announcements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-xl border p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📢</span>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">
                          {announcement.title}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {announcement.audience === "all"
                            ? "Everyone"
                            : announcement.audience}
                        </p>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                          {announcement.content}
                        </p>

                        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                          Published {formatDate(announcement.published_at)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Assignments</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Published assignments for your children&apos;s classes.
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {data.assignments.length}
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {data.assignments.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No assignments available.
                  </p>
                </div>
              ) : (
                data.assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-xl border p-4 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{assignment.title}</h3>

                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {assignment.subject_name}
                          {assignment.subject_code
                            ? ` (${assignment.subject_code})`
                            : ""}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950 dark:text-green-300">
                        {assignment.status}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>Class: {assignment.class_name}</p>
                      <p>
                        Teacher: {assignment.teacher_first_name}{" "}
                        {assignment.teacher_last_name}
                      </p>

                      {assignment.due_date && (
                        <p>Due: {formatDate(assignment.due_date)}</p>
                      )}
                    </div>

                    {assignment.description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700 dark:text-gray-300">
                        {assignment.description}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
