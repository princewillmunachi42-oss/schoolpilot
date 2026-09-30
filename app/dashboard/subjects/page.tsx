import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SubjectsPage() {
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

  if (!membership || membership.role !== "owner") {
    redirect("/dashboard");
  }

  const subjectsResult = await pool.query(
    `SELECT
       id,
       name,
       code,
       created_at
     FROM subjects
     WHERE school_id = $1
     ORDER BY name ASC`,
    [membership.school_id]
  );

  const subjects = subjectsResult.rows;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Subjects
          </h1>

          <p className="mt-2 text-muted-foreground">
            Create and manage the subjects taught in your school.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Create Subject</h2>

          <form
            action="/api/school/subjects"
            method="POST"
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium"
              >
                Subject Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Mathematics"
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="code"
                className="mb-2 block text-sm font-medium"
              >
                Subject Code
              </label>

              <input
                id="code"
                name="code"
                type="text"
                required
                placeholder="e.g. MATH"
                className="w-full rounded-lg border bg-background px-3 py-2.5 uppercase outline-none focus:border-primary"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Use a short unique code for the subject.
              </p>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Create Subject
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">School Subjects</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {subjects.length}{" "}
              {subjects.length === 1 ? "subject" : "subjects"} created
            </p>
          </div>

          {subjects.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No subjects yet</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Create your first subject using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{subject.name}</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Code: {subject.code}
                    </p>
                  </div>

                  <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Active
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
