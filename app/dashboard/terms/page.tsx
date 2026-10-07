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
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <a
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </a>

            <div className="mt-5">
              <p className="text-sm font-semibold text-primary">
                Academic Management
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Terms
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create and manage academic terms within your school's sessions.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <div>
            <p className="text-sm font-semibold text-primary">At a glance</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Academic overview
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Total Terms",
                count: terms.length,
                tone: "bg-primary/10 text-primary",
              },
              {
                label: "Current Terms",
                count: terms.filter((term) => term.is_current).length,
                tone: "bg-success/10 text-success",
              },
              {
                label: "Sessions Available",
                count: sessions.length,
                tone: "bg-accent/10 text-accent",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="group rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">
                      {card.count}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.tone}`}
                  >
                    <span className="text-sm font-bold">#</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

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
            <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="border-b px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="text-sm font-bold">T</span>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight">
                        Your Academic Terms
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {terms.length === 0
                          ? "No terms have been created yet."
                          : "Showing " + terms.length + " academic term" + (terms.length === 1 ? "" : "s")}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                    {membership.school_name}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
              {terms.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {terms.map((term) => (
                    <div
                      key={term.id}
                      className="group rounded-2xl border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:p-6"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold tracking-tight">
                              {term.name}
                            </h3>

                            {term.is_current && (
                              <span className="inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                                Current
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-sm font-semibold text-primary">
                            {term.session_name}
                          </p>

                          <p className="mt-1.5 text-sm text-muted-foreground">
                            {new Date(
                              term.start_date
                            ).toLocaleDateString()}{" "}
                            —{" "}
                            {new Date(
                              term.end_date
                            ).toLocaleDateString()}
                          </p>

                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            Academic term period
                          </p>
                        </div>

                        <div className="shrink-0">
                          <TermActions id={term.id} />
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
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
