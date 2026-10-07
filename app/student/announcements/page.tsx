import Link from "next/link";
import { redirect } from "next/navigation";
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
    <main className="mx-auto w-full max-w-5xl p-5 sm:p-8">
      <div className="mb-6">
        <Link
          href="/student"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to Dashboard
        </Link>

        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Announcements
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Important updates and messages from your school.
          </p>
        </div>
      </div>

      {announcements.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            No announcements yet
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your school has not published any announcements for students.
          </p>
        </div>
      ) : (
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
                className="rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold">
                      {announcement.title}
                    </h2>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {author || "School Administration"} •{" "}
                      {publishedDate.toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {announcement.content}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
