import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SchoolSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const result = await pool.query(
    `SELECT
       sm.school_id,
       sm.role,
       s.name AS school_name,
       s.email AS school_email
     FROM school_members sm
     JOIN schools s ON s.id = sm.school_id
     WHERE sm.user_id = $1
     ORDER BY s.name
     LIMIT 1`,
    [user.id]
  );

  const membership = result.rows[0];

  if (!membership) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <a
            href="/dashboard"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to dashboard
          </a>

          <p className="mt-6 text-sm font-medium text-primary">
            School Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            School Settings
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage your school's basic information.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form action="/api/school/settings" method="POST" className="space-y-6">
            <div>
              <label
                htmlFor="schoolName"
                className="block text-sm font-semibold"
              >
                School name
              </label>

              <input
                id="schoolName"
                name="schoolName"
                type="text"
                defaultValue={membership.school_name}
                required
                className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="schoolEmail"
                className="block text-sm font-semibold"
              >
                School email
              </label>

              <input
                id="schoolEmail"
                name="schoolEmail"
                type="email"
                defaultValue={membership.school_email}
                required
                className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="rounded-xl bg-muted/60 p-4">
              <p className="text-xs text-muted-foreground">
                Account owner
              </p>

              <p className="mt-1 text-sm font-medium">
                {user.first_name} {user.last_name}
              </p>

              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {membership.role}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <a
                href="/dashboard"
                className="rounded-xl border px-5 py-3 text-center text-sm font-semibold transition-colors hover:bg-muted"
              >
                Cancel
              </a>

              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                Save changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
