"use client";

import { useEffect, useState } from "react";

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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <a
          href="/teacher"
          className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to Teacher Dashboard
        </a>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            School announcements and messages for teachers.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Loading announcements...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="text-sm font-medium text-destructive">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && announcements.length === 0 && (
          <div className="rounded-xl border bg-card p-8 text-center">
            <h2 className="text-base font-semibold">
              No announcements yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Published school or teacher announcements will appear here.
            </p>
          </div>
        )}

        {!loading && !error && announcements.length > 0 && (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <article
                key={announcement.id}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold">
                      {announcement.title}
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Published{" "}
                      {formatDate(
                        announcement.published_at ||
                          announcement.created_at
                      )}{" "}
                      · By {creatorName(announcement)}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {announcement.audience === "teachers"
                      ? "Teachers"
                      : "Everyone"}
                  </span>
                </div>

                <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {announcement.content}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
