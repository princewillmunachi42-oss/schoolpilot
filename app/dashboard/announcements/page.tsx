import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import AnnouncementActions from "@/components/AnnouncementActions";
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

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
           <a
  href="/dashboard"
  className="inline-flex min-h-11 items-center rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
>
  {"← Back to Dashboard"}
</a>
            <p className="text-sm font-medium text-primary">
              School Communication
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Announcements
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Create and manage announcements for your school community.
            </p>
          </div>

          <a
            href="/dashboard/announcements/new"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            + New Announcement
          </a>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {announcements.length === 0 ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <h2 className="text-lg font-semibold">
                No announcements yet
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Create your first announcement to communicate with your school
                community.
              </p>
            </div>
          ) : (
            announcements.map((announcement) => (
             <article
  key={announcement.id}
  className="flex h-full flex-col rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md sm:p-6"
>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {announcement.title}
                    </h2>

                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      Audience: {announcement.audience}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium capitalize text-primary">
                    {announcement.status}
                  </span>
                </div>

                 <p className="mt-4 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                  {announcement.content}
                </p>
             <div className="mt-6 border-t pt-5">
  {announcement.signature_data ? (
    <div>
      <img
        src={announcement.signature_data}
        alt="Digital signature"
        className="h-16 w-auto max-w-full object-contain object-left"
      />

      <p className="mt-2 text-sm font-semibold">
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
    <p className="text-xs text-muted-foreground">
      No signature attached
    </p>
  )}
</div>
              <div className="mt-6 border-t pt-5">
  {announcement.signature_data ? (
    <div>
      <img
        src={announcement.signature_data}
        alt="Digital signature"
        className="h-16 w-auto max-w-full object-contain object-left"
      />

      <p className="mt-2 text-sm font-semibold">
        Signed by School Administrator
      </p>

      <p className="text-xs text-muted-foreground">
        Official School Announcement
      </p>
    </div>
  ) : (
    <p className="text-xs text-muted-foreground">
      No signature attached
    </p>
  )}
</div>
<div className="mt-5 border-t pt-4">
  <AnnouncementActions id={announcement.id} />
</div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
