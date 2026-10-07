import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookMarked,
  CheckCircle2,
  Code2,
  Layers3,
  Plus,
} from "lucide-react";
import pool from "@/lib/db";
import SubjectActions from "@/components/SubjectActions";
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
       status,
       name,
       code,
       created_at
     FROM subjects
     WHERE school_id = $1
     ORDER BY name ASC`,
    [membership.school_id]
  );

  const subjects = subjectsResult.rows;

  const activeSubjects = subjects.filter(
    (subject) => subject.status === "active"
  ).length;

  const inactiveSubjects = subjects.filter(
    (subject) => subject.status !== "active"
  ).length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="mt-5">
              <p className="text-sm font-semibold text-primary">
                Academic Management
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Subjects
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create and manage the subjects taught across your school.
              </p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <section className="mb-8">
          <div>
            <p className="text-sm font-semibold text-primary">
              At a glance
            </p>

            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Subject overview
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Total Subjects",
                count: subjects.length,
                icon: Layers3,
                tone: "bg-primary/10 text-primary",
              },
              {
                label: "Active Subjects",
                count: activeSubjects,
                icon: CheckCircle2,
                tone: "bg-success/10 text-success",
              },
              {
                label: "Inactive Subjects",
                count: inactiveSubjects,
                icon: BookMarked,
                tone: "bg-muted text-muted-foreground",
              },
            ].map((card) => {
              const Icon = card.icon;

              return (
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
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* Create subject */}
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    Subject Management
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Add New Subject
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Add a subject and give it a unique short code.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <form
                action="/api/school/subjects"
                method="POST"
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold"
                  >
                    Subject Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. Mathematics"
                    className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="code"
                    className="block text-sm font-semibold"
                  >
                    Subject Code
                  </label>

                  <div className="relative mt-2">
                    <Code2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      id="code"
                      name="code"
                      type="text"
                      required
                      placeholder="e.g. MATH"
                      className="min-h-11 w-full rounded-xl border bg-background py-2.5 pl-10 pr-3.5 text-sm uppercase outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    Use a short unique code for the subject.
                  </p>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  Create Subject
                </button>
              </form>
            </div>
          </section>

          {/* Subject list */}
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookMarked className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight">
                      School Subjects
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {subjects.length === 0
                        ? "No subjects have been created yet."
                        : "Showing " +
                          subjects.length +
                          " subject" +
                          (subjects.length === 1 ? "" : "s")}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  {activeSubjects} active
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {subjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-background p-8 text-center sm:p-10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <BookMarked className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 text-base font-bold">
                    No subjects yet
                  </h3>

                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
                    Create your first subject using the form beside this
                    list.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="group rounded-2xl border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <BookMarked className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold tracking-tight">
                                {subject.name}
                              </h3>

                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  subject.status === "active"
                                    ? "bg-success/10 text-success"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {subject.status}
                              </span>
                            </div>

                            <p className="mt-2 text-sm font-semibold text-primary">
                              Code: {subject.code}
                            </p>

                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                              Subject code
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <SubjectActions id={subject.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
