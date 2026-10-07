import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentNotificationPage({
  params,
}: PageProps) {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const { id } = await params;

  const result = await pool.query(
    `
      SELECT
        id,
        title,
        message,
        type,
        link,
        is_read,
        created_at
      FROM notifications
      WHERE id = $1
        AND school_id = $2
        AND user_id = $3
      LIMIT 1
    `,
    [
      id,
      currentStudent.schoolId,
      currentStudent.userId,
    ]
  );

  const notification = result.rows[0];

  if (!notification) {
    notFound();
  }

  if (!notification.is_read) {
    await pool.query(
      `
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = $1
          AND school_id = $2
          AND user_id = $3
      `,
      [
        notification.id,
        currentStudent.schoolId,
        currentStudent.userId,
      ]
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <Link
          href="/student/notifications"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to Notifications
        </Link>
      </div>

      <article className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
            {notification.type}
          </span>

          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-NG", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(notification.created_at))}
          </span>
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          {notification.title}
        </h1>

        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {notification.message}
        </p>

        {notification.link && (
          <div className="mt-6">
            <Link
              href={notification.link}
              className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Open Related Page
            </Link>
          </div>
        )}
      </article>
    </section>
  );
}
