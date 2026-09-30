import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ClassesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membershipResult = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership) {
    redirect("/dashboard");
  }

  if (membership.role !== "owner") {
    redirect("/dashboard");
  }

  const sessionsResult = await pool.query(
    `SELECT id, name, is_current
     FROM academic_sessions
     WHERE school_id = $1
     ORDER BY start_date DESC`,
    [membership.school_id]
  );

  const sessions = sessionsResult.rows;

  const classesResult = await pool.query(
    `SELECT
       c.id,
       c.name,
       c.capacity,
       c.status,
       c.academic_session_id,
       s.name AS session_name
     FROM classes c
     JOIN academic_sessions s
       ON s.id = c.academic_session_id
     WHERE c.school_id = $1
     ORDER BY s.start_date DESC, c.name ASC`,
    [membership.school_id]
  );

  const classes = classesResult.rows;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              ← Back to Dashboard
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Classes
            </h1>

            <p className="mt-2 text-muted-foreground">
              Create and manage your school classes by academic session.
            </p>
          </div>
        </div>

        <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Create Class</h2>

          {sessions.length === 0 ? (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
              <p className="font-medium">
                No academic sessions found.
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Create an academic session before adding classes.
              </p>

              <Link
                href="/dashboard/sessions"
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Create Session
              </Link>
            </div>
          ) : (
            <form
              action="/api/school/classes"
              method="POST"
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="academicSessionId"
                  className="mb-2 block text-sm font-medium"
                >
                  Academic Session
                </label>

                <select
                  id="academicSessionId"
                  name="academicSessionId"
                  required
                  defaultValue={
                    sessions.find((session) => session.is_current)?.id ??
                    sessions[0].id
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                      {session.is_current ? " (Current)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium"
                >
                  Class Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. JSS 1"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="capacity"
                  className="mb-2 block text-sm font-medium"
                >
                  Capacity
                </label>

                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder="e.g. 40"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Optional. Leave blank if there is no fixed capacity.
                </p>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue="active"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Create Class
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">School Classes</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {classes.length}{" "}
              {classes.length === 1 ? "class" : "classes"} created
            </p>
          </div>

          {classes.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No classes yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first class using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{classItem.name}</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {classItem.session_name}
                      {classItem.capacity
                        ? ` • Capacity: ${classItem.capacity}`
                        : " • No fixed capacity"}
                    </p>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      classItem.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {classItem.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
