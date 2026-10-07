"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  Megaphone,
  Users,
} from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  content: string;
  audience: "all" | "teachers";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_first_name: string | null;
  created_by_last_name: string | null;
};

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/teacher/announcements", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load announcements."
          );
        }

        setAnnouncements(data.announcements || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load announcements."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  function formatDate(date: string | null) {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function creatorName(announcement: Announcement) {
    const name = [
      announcement.created_by_first_name,
      announcement.created_by_last_name,
    ]
      .filter(Boolean)
      .join(" ");

    return name || "School Administration";
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/teacher"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Teacher Dashboard
        </Link>

        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Megaphone className="h-3.5 w-3.5" />
                School communication
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Announcements
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Stay up to date with school announcements and
                important messages for teachers.
              </p>
            </div>

            {!loading && !error && (
              <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Published
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {announcements.length}
                </p>
              </div>
            )}
          </div>
        </header>

        {loading && (
          <section className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-44 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </section>
        )}

        {!loading && error && (
          <section
            className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-destructive">
                  Unable to load announcements
                </h2>

                <p className="mt-1 text-sm leading-6 text-destructive/80">
                  {error}
                </p>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && announcements.length === 0 && (
          <section className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Bell className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              No announcements yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Published school or teacher announcements will
              appear here when they are available.
            </p>

            <Link
              href="/teacher"
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </section>
        )}

        {!loading && !error && announcements.length > 0 && (
          <section className="space-y-4">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Megaphone className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold leading-7">
                          {announcement.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Published{" "}
                            {formatDate(
                              announcement.published_at ||
                                announcement.created_at
                            )}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            By {creatorName(announcement)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        announcement.audience === "teachers"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-success/20 bg-success/10 text-success"
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {announcement.audience === "teachers"
                        ? "Teachers"
                        : "Everyone"}
                    </span>
                  </div>

                  <div className="mt-5 border-t border-border pt-5">
                    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
