import { redirect } from "next/navigation";
import Link from "next/link";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import AnnouncementActions from "@/components/AnnouncementActions";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  FileText,
  Megaphone,
  Plus,
  Send,
  Users,
} from "lucide-react";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membershipResult = await pool.query(
    `
      SELECT school_id, role
      FROM school_members
      WHERE user_id = $1
      LIMIT 1
    `,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (
    !membership ||
    !["owner", "principal", "admin"].includes(membership.role)
  ) {
    redirect("/dashboard");
  }

  const announcementsResult = await pool.query(
    `
      SELECT
        a.id,
        a.title,
        a.content,
        a.audience,
        a.status,
        a.published_at,
        a.created_at,
        a.signature_data,
        u.first_name AS creator_first_name,
        u.last_name AS creator_last_name,
        sm.role AS creator_role
      FROM announcements a
      JOIN users u
        ON u.id = a.created_by
      JOIN school_members sm
        ON sm.user_id = a.created_by
       AND sm.school_id = a.school_id
      WHERE a.school_id = $1
      ORDER BY
        COALESCE(a.published_at, a.created_at) DESC,
        a.created_at DESC
    `,
    [membership.school_id]
  );

  const announcements = announcementsResult.rows;

  const publishedCount = announcements.filter(
    (announcement) => announcement.status === "published"
  ).length;

  const draftCount = announcements.filter(
    (announcement) => announcement.status === "draft"
  ).length;

  const audienceCount = new Set(
    announcements.map((announcement) => announcement.audience)
  ).size;

  function formatDate(value: string | Date | null) {
    if (!value) return "Not published";

    return new Date(value).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function statusClasses(status: string) {
    if (status === "published") {
      return "border-success/20 bg-success/10 text-success";
    }

    return "border-warning/20 bg-warning/10 text-warning";
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <Megaphone className="h-4 w-4" />
                School Communication
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Announcements
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create and manage official announcements for your school
                community.
              </p>
            </div>

            <Link
              href="/dashboard/announcements/new"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </Link>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Total
              </span>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Megaphone className="h-5 w-5" />
              </div>
            </div>

            <p className="text-2xl font-bold">{announcements.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              All announcements
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Published
              </span>
              <div className="rounded-xl bg-success/10 p-2.5 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <p className="text-2xl font-bold">{publishedCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Currently published
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Drafts
              </span>
              <div className="rounded-xl bg-warning/10 p-2.5 text-warning">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            <p className="text-2xl font-bold">{draftCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Unpublished announcements
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Audiences
              </span>
              <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <p className="text-2xl font-bold">{audienceCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Different audiences reached
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b bg-muted/30 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Bell className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">School Announcements</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Official communication published by authorized school
                  administrators.
                </p>
              </div>
            </div>
          </div>

          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-muted p-4 text-muted-foreground">
                <Megaphone className="h-8 w-8" />
              </div>

              <h3 className="font-semibold">No announcements yet</h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create your first announcement to communicate important
                information with your school community.
              </p>

              <Link
                href="/dashboard/announcements/new"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4" />
                Create Announcement
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">
                            {announcement.title}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses(
                              announcement.status
                            )}`}
                          >
                            {announcement.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            Audience: {announcement.audience}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(
                              announcement.published_at ||
                                announcement.created_at
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <AnnouncementActions id={announcement.id} />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-background p-4 sm:p-5">
                      <p className="whitespace-pre-wrap break-words text-sm leading-7">
                        {announcement.content}
                      </p>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Send className="h-4 w-4" />
                          Official Signature
                        </div>

                        {announcement.signature_data ? (
                          <div>
                            <img
                              src={announcement.signature_data}
                              alt="Digital signature"
                              className="h-16 w-auto max-w-full object-contain object-left"
                            />

                            <p className="mt-3 text-sm font-semibold">
                              {announcement.creator_first_name}{" "}
                              {announcement.creator_last_name}
                            </p>

                            <p className="text-xs capitalize text-muted-foreground">
                              {announcement.creator_role}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              Official School Announcement
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            No digital signature attached
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border bg-muted/20 p-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          Announcement Details
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              Created by
                            </span>
                            <span className="text-right font-medium">
                              {announcement.creator_first_name}{" "}
                              {announcement.creator_last_name}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              Role
                            </span>
                            <span className="capitalize font-medium">
                              {announcement.creator_role}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              Published
                            </span>
                            <span className="font-medium">
                              {formatDate(announcement.published_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
