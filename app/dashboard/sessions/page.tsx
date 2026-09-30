import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SessionsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membershipResult = await pool.query(
    `SELECT
       sm.school_id,
       sm.role,
       s.name AS school_name
     FROM school_members sm
     JOIN schools s ON s.id = sm.school_id
     WHERE sm.user_id = $1
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership) {
    redirect("/login");
  }

  const sessionsResult = await pool.query(
    `SELECT
       id,
       name,
       start_date,
       end_date,
       is_current
     FROM academic_sessions
     WHERE school_id = $1
     ORDER BY start_date DESC`,
    [membership.school_id]
  );

  const sessions = sessionsResult.rows;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <a
            href="/dashboard"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to dashboard
          </a>

          <p className="mt-6 text-sm font-medium text-primary">
            Academic Management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Academic Sessions
          </h1>

          <p className="mt-2 text-muted-foreground">
            Create and manage your school's academic sessions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold">Add academic session</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Create a new academic year or session.
            </p>

            <form
              action="/api/school/sessions"
              method="POST"
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold"
                >
                  Session name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="2026/2027"
                  required
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-semibold"
                >
                  Start date
                </label>

                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  required
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-semibold"
                >
                  End date
                </label>

                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  required
                  className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <label className="flex items-center gap-3 rounded-xl border p-4">
                <input
                  name="isCurrent"
                  type="checkbox"
                  value="true"
                  className="h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-semibold">
                    Set as current session
                  </span>

                  <span className="mt-1 block text-xs text-muted-foreground">
                    This will make this the active academic session.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                Create session
              </button>
            </form>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Your sessions</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {sessions.length === 0
                    ? "No academic sessions have been created yet."
                    : `${sessions.length} academic session${
                        sessions.length === 1 ? "" : "s"
                      }`}
                </p>
              </div>

              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {membership.school_name}
              </span>
            </div>

            {sessions.length > 0 ? (
              <div className="mt-6 space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {session.name}
                          </h3>

                          {session.is_current && (
                            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(session.start_date).toLocaleDateString()}{" "}
                          —{" "}
                          {new Date(session.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-muted/60 p-8 text-center">
                <p className="text-sm font-medium">
                  No sessions yet
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Use the form to create your first academic session.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
