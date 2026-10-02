import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import TermActions from "@/components/TermActions";
export default async function TermsPage() {
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
       is_current
     FROM academic_sessions
     WHERE school_id = $1
     ORDER BY start_date DESC`,
    [membership.school_id]
  );

  const termsResult = await pool.query(
    `SELECT
       t.id,
       t.name,
       t.start_date,
       t.end_date,
       t.is_current,
       t.academic_session_id,
       ac.name AS session_name
     FROM terms t
     JOIN academic_sessions ac
       ON ac.id = t.academic_session_id
     WHERE t.school_id = $1
     ORDER BY ac.start_date DESC, t.start_date ASC`,
    [membership.school_id]
  );

  const sessions = sessionsResult.rows;
  const terms = termsResult.rows;

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
            Terms
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage terms within your academic sessions.
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold">
              Create an academic session first
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Terms must belong to an academic session.
            </p>

            <a
              href="/dashboard/sessions"
              className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Manage academic sessions
            </a>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-bold">Add term</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Add a term to one of your academic sessions.
              </p>

              <form
                action="/api/school/terms"
                method="POST"
                className="mt-6 space-y-5"
              >
                <div>
                  <label
                    htmlFor="academicSessionId"
                    className="block text-sm font-semibold"
                  >
                    Academic session
                  </label>

                  <select
                    id="academicSessionId"
                    name="academicSessionId"
                    required
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                        {session.is_current ? " — Current" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold"
                  >
                    Term name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="First Term"
                    required
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                    className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      Set as current term
                    </span>

                    <span className="mt-1 block text-xs text-muted-foreground">
                      This will make this the active term for your school.
                    </span>
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Create term
                </button>
              </form>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Your terms</h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {terms.length === 0
                      ? "No terms have been created yet."
                      : `${terms.length} term${
                          terms.length === 1 ? "" : "s"
                        }`}
                  </p>
                </div>

                <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
                  {membership.school_name}
                </span>
              </div>

              {terms.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {terms.map((term) => (
                    <div
                      key={term.id}
                      className="rounded-xl border p-4"
                    >
                <TermActions id={term.id} />
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                              {term.name}
                            </h3>

                            {term.is_current && (
                              <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs font-medium text-primary">
                            {term.session_name}
                          </p>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(
                              term.start_date
                            ).toLocaleDateString()}{" "}
                            —{" "}
                            {new Date(
                              term.end_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl bg-muted/60 p-8 text-center">
                  <p className="text-sm font-medium">
                    No terms yet
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Use the form to create your first term.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
