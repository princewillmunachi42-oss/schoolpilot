import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import SessionActions from "@/components/SessionActions";
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
                Academic Sessions
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create and manage your school's academic sessions and active school year.
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
                label: "Total Sessions",
                count: sessions.length,
                tone: "bg-primary/10 text-primary",
              },
              {
                label: "Current Session",
                count: sessions.filter((session) => session.is_current).length,
                tone: "bg-success/10 text-success",
              },
              {
                label: "Past Sessions",
                count: sessions.filter((session) => !session.is_current).length,
                tone: "bg-muted text-muted-foreground",
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

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="text-lg font-bold">+</span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    Session Management
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Add Academic Session
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Create a new academic year or session for your school.
                  </p>
                </div>
              </div>
            </div>

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
                  className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <label className="group flex cursor-pointer items-start gap-3 rounded-xl border bg-background p-4 transition-all hover:border-primary/30 hover:bg-primary/5">
                <input
                  name="isCurrent"
                  type="checkbox"
                  value="true"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />

                <span>
                  <span className="block text-sm font-semibold">
                    Set as current session
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    This will make this the active academic session.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md"
              >
                Create session
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="text-sm font-bold">S</span>
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight">
                      Your Academic Sessions
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {sessions.length === 0
                        ? "No academic sessions have been created yet."
                        : `Showing ${sessions.length} academic session${sessions.length === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  {membership.school_name}
                </span>
              </div>
            </div>

            {sessions.length > 0 ? (
              <div className="mt-6 space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="group rounded-2xl border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold tracking-tight">
                            {session.name}
                          </h3>

                          {session.is_current && (
                            <span className="inline-flex rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-muted-foreground">
                          {new Date(session.start_date).toLocaleDateString()}{" "}
                          —{" "}
                          {new Date(session.end_date).toLocaleDateString()}
                        </p>

                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          Academic session period
                        </p>
                      </div>

                      <div className="shrink-0">
                        <SessionActions id={session.id} />
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
          </section>
        </div>
      </div>
    </main>
  );
}
