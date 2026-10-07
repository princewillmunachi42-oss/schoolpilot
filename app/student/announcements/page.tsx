import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ChevronRight,
  Megaphone,
  Newspaper,
  UserRound,
} from "lucide-react";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";

export default async function StudentAnnouncementsPage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const result = await pool.query(
    `
      SELECT
        a.id,
        a.title,
        a.content,
        a.published_at,
        a.created_at,
        u.first_name AS created_by_first_name,
        u.last_name AS created_by_last_name
      FROM announcements a
      INNER JOIN users u
        ON u.id = a.created_by
      WHERE a.school_id = $1
        AND a.status = 'published'
        AND (
          a.audience = 'all'
          OR a.audience = 'students'
        )
      ORDER BY
        COALESCE(a.published_at, a.created_at) DESC,
        a.created_at DESC
    `,
    [currentStudent.schoolId]
  );

  const announcements = result.rows;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
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
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Megaphone className="h-5 w-5" />
              </div>

              <p className="text-sm font-semibold text-primary">
                Student Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Announcements
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Stay informed about important school updates, events, notices,
                and messages from your school.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border bg-background px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Newspaper className="h-4 w-4" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Published
                </p>
                <p className="text-lg font-bold">
                  {announcements.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {announcements.length === 0 ? (
        <div className="rounded-3xl border bg-card px-6 py-14 text-center sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bell className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            No announcements yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Your school has not published any announcements for students yet.
            New school updates will appear here.
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
        <>
          {/* Section heading */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Latest announcements
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Important messages published by your school.
            </p>
          </div>

          {/* Announcement list */}
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const publishedDate = announcement.published_at
                ? new Date(announcement.published_at)
                : new Date(announcement.created_at);

              const author = [
                announcement.created_by_first_name,
                announcement.created_by_last_name,
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <article
                  key={announcement.id}
                  className="group rounded-2xl border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Announcement icon */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Megaphone className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Title */}
                      <h2 className="text-lg font-bold leading-7">
                        {announcement.title}
                      </h2>

                      {/* Metadata */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {author || "School Administration"}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {publishedDate.toLocaleDateString("en-NG", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="mt-5 whitespace-pre-wrap border-t pt-4 text-sm leading-7 text-muted-foreground">
                        {announcement.content}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
