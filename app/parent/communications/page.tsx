"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Mail,
  Megaphone,
  RefreshCw,
  UserRound,
} from "lucide-react";

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

function formatAudience(value: string) {
  if (value === "all") return "Everyone";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ParentCommunicationsPage() {
  const [data, setData] =
    useState<CommunicationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          result.message || "Failed to load communications.",
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load communications.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommunications();
  }, []);

  async function markCommunicationAsRead(
    communicationId: string,
  ) {
    try {
      const response = await fetch(
        "/api/parent/communications",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            communicationId,
          }),
        },
      );

      if (!response.ok) {
        return;
      }

      setData((current) => {
        if (!current) return current;

        const communication = current.communications.find(
          (item) => item.id === communicationId,
        );

        if (!communication || communication.is_read) {
          return current;
        }

        return {
          ...current,
          communications: current.communications.map(
            (item) =>
              item.id === communicationId
                ? { ...item, is_read: true }
                : item,
          ),
          unreadCount: Math.max(
            0,
            current.unreadCount - 1,
          ),
        };
      });
    } catch (err) {
      console.error(
        "Failed to mark communication as read:",
        err,
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <RefreshCw className="h-5 w-5 animate-spin text-[var(--primary)]" />
              </div>

              <div>
                <p className="font-semibold">
                  Loading communications
                </p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Fetching the latest school updates...
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
            <div className="rounded-2xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--destructive)]/10">
                  <Mail className="h-5 w-5 text-[var(--destructive)]" />
                </div>

                <div>
                  <h1 className="font-bold">
                    Unable to load communications
                  </h1>

                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                    {error}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={loadCommunications}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>

                <Link
                  href="/parent"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--muted)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Parent Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const totalMessages = data.communications.length;
  const totalAnnouncements = data.announcements.length;
  const totalAssignments = data.assignments.length;

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
                    <Mail className="h-3.5 w-3.5" />
                    Parent Portal
                  </div>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    Communications
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                    Stay connected with your school and keep up
                    with important updates for your children.
                  </p>
                </div>

                {data.unreadCount > 0 && (
                  <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 px-4 py-3">
                    <Bell className="h-5 w-5 text-[var(--primary)]" />

                    <div>
                      <p className="text-sm font-bold text-[var(--primary)]">
                        {data.unreadCount} unread{" "}
                        {data.unreadCount === 1
                          ? "message"
                          : "messages"}
                      </p>

                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        Tap a message to mark it read
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <Mail className="h-5 w-5 text-[var(--primary)]" />
              </div>

              <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                Messages
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold">
              {totalMessages}
            </p>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Direct school messages
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                <Megaphone className="h-5 w-5 text-[var(--accent)]" />
              </div>

              <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                School
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold">
              {totalAnnouncements}
            </p>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Published announcements
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--success)]/10">
                <ClipboardList className="h-5 w-5 text-[var(--success)]" />
              </div>

              <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                Academics
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold">
              {totalAssignments}
            </p>

            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Published assignments
            </p>
          </div>
        </section>

        {/* Direct Messages */}
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <Mail className="h-5 w-5 text-[var(--primary)]" />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Direct Messages
                </h2>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Messages sent directly to you by the school.
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-semibold">
              {totalMessages}{" "}
              {totalMessages === 1 ? "message" : "messages"}
            </span>
          </div>

          {data.communications.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--muted)]/40 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--card)]">
                <Mail className="h-7 w-7 text-[var(--muted-foreground)]" />
              </div>

              <p className="mt-4 font-semibold">
                No messages yet
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted-foreground)]">
                School messages sent directly to you will appear
                here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {data.communications.map((communication) => (
                <article
                  key={communication.id}
                  onClick={() => {
                    if (!communication.is_read) {
                      markCommunicationAsRead(
                        communication.id,
                      );
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm sm:p-5 ${
                    communication.is_read
                      ? "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]/40"
                      : "border-[var(--primary)]/20 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        communication.is_read
                          ? "bg-[var(--muted)]"
                          : "bg-[var(--primary)]/10"
                      }`}
                    >
                      {communication.is_read ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--muted-foreground)]" />
                      ) : (
                        <Bell className="h-5 w-5 text-[var(--primary)]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">
                              {communication.subject}
                            </h3>

                            {!communication.is_read && (
                              <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                                New
                              </span>
                            )}
                          </div>

                          {communication.student_first_name && (
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                              <UserRound className="h-3.5 w-3.5" />

                              <span>
                                Regarding:{" "}
                                {communication.student_first_name}{" "}
                                {communication.student_last_name ||
                                  ""}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                          <Clock3 className="h-3.5 w-3.5" />
                          {formatDateTime(
                            communication.created_at,
                          )}
                        </div>
                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">
                        {communication.message}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Announcements + Assignments */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Announcements */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)]/10">
                  <Megaphone className="h-5 w-5 text-[var(--accent)]" />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Announcements
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Important updates from the school.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-semibold">
                {totalAnnouncements}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {data.announcements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-7 text-center">
                  <Megaphone className="mx-auto h-6 w-6 text-[var(--muted-foreground)]" />

                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                    No announcements available.
                  </p>
                </div>
              ) : (
                data.announcements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-2xl border border-[var(--border)] p-4 transition hover:bg-[var(--muted)]/40"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                        <Megaphone className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="font-bold">
                            {announcement.title}
                          </h3>

                          <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-[10px] font-semibold">
                            {formatAudience(
                              announcement.audience,
                            )}
                          </span>
                        </div>

                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">
                          {announcement.content}
                        </p>

                        <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                          <CalendarDays className="h-3.5 w-3.5" />
                          Published{" "}
                          {formatDate(
                            announcement.published_at,
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          {/* Assignments */}
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--success)]/10">
                  <ClipboardList className="h-5 w-5 text-[var(--success)]" />
                </div>

                <div>
                  <h2 className="text-lg font-bold">
                    Assignments
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Published assignments for your children&apos;s
                    classes.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-[var(--muted)] px-3 py-1.5 text-xs font-semibold">
                {totalAssignments}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {data.assignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-7 text-center">
                  <ClipboardList className="mx-auto h-6 w-6 text-[var(--muted-foreground)]" />

                  <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                    No assignments available.
                  </p>
                </div>
              ) : (
                data.assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-2xl border border-[var(--border)] p-4 transition hover:bg-[var(--muted)]/40"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--success)]/10">
                        <BookOpen className="h-4.5 w-4.5 text-[var(--success)]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-bold">
                              {assignment.title}
                            </h3>

                            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                              {assignment.subject_name}
                              {assignment.subject_code
                                ? ` (${assignment.subject_code})`
                                : ""}
                            </p>
                          </div>

                          <span className="inline-flex w-fit rounded-full bg-[var(--success)]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--success)]">
                            {formatStatus(
                              assignment.status,
                            )}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-xs text-[var(--muted-foreground)]">
                          <div className="flex items-center gap-2">
                            <GraduationIcon />
                            <span>
                              Class: {assignment.class_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <UserRound className="h-3.5 w-3.5" />
                            <span>
                              Teacher:{" "}
                              {assignment.teacher_first_name}{" "}
                              {assignment.teacher_last_name}
                            </span>
                          </div>

                          {assignment.due_date && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5" />
                              <span>
                                Due:{" "}
                                {formatDate(
                                  assignment.due_date,
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {assignment.description && (
                          <p className="mt-4 whitespace-pre-wrap border-t border-[var(--border)] pt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                    </div>
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

function GraduationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 9 9-5 9 5-9 5-9-5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 11.2V16c2.7 2.1 7.3 2.1 10 0v-4.8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 9v6"
      />
    </svg>
  );
}
