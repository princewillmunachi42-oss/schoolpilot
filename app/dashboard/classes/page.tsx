import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers3,
  Plus,
  Users,
} from "lucide-react";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import ClassActions from "@/components/ClassActions";

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

  const activeClasses = classes.filter(
    (classItem) => classItem.status === "active"
  ).length;

  const inactiveClasses = classes.filter(
    (classItem) => classItem.status !== "active"
  ).length;

  const currentSession = sessions.find(
    (session) => session.is_current
  );

  const currentSessionClasses = currentSession
    ? classes.filter(
        (classItem) =>
          classItem.academic_session_id === currentSession.id
      ).length
    : 0;

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
                Classes
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create and manage your school classes across academic
                sessions.
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
              Class overview
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Classes",
                count: classes.length,
                icon: Layers3,
                tone: "bg-primary/10 text-primary",
              },
              {
                label: "Active Classes",
                count: activeClasses,
                icon: CheckCircle2,
                tone: "bg-success/10 text-success",
              },
              {
                label: "Inactive Classes",
                count: inactiveClasses,
                icon: BookOpen,
                tone: "bg-muted text-muted-foreground",
              },
              {
                label: "Current Session",
                count: currentSessionClasses,
                icon: GraduationCap,
                tone: "bg-accent/10 text-accent",
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
          {/* Create class */}
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    Class Management
                  </p>

                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Add New Class
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Create a class and assign it to an academic session.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="font-semibold">
                        No academic sessions found
                      </p>

                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Create an academic session before adding
                        classes.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/sessions"
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md"
                  >
                    Create Academic Session
                  </Link>
                </div>
              ) : (
                <form
                  action="/api/school/classes"
                  method="POST"
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="academicSessionId"
                      className="block text-sm font-semibold"
                    >
                      Academic Session
                    </label>

                    <select
                      id="academicSessionId"
                      name="academicSessionId"
                      required
                      defaultValue={
                        sessions.find((session) => session.is_current)
                          ?.id ?? sessions[0].id
                      }
                      className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                      className="block text-sm font-semibold"
                    >
                      Class Name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. JSS 1"
                      className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="capacity"
                      className="block text-sm font-semibold"
                    >
                      Student Capacity
                    </label>

                    <div className="relative mt-2">
                      <Users className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        id="capacity"
                        name="capacity"
                        type="number"
                        min="1"
                        placeholder="e.g. 40"
                        className="min-h-11 w-full rounded-xl border bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                      Optional. Leave blank if there is no fixed
                      capacity.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="status"
                      className="block text-sm font-semibold"
                    >
                      Status
                    </label>

                    <select
                      id="status"
                      name="status"
                      defaultValue="active"
                      className="mt-2 min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Create Class
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* Class list */}
          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold tracking-tight">
                      School Classes
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {classes.length === 0
                        ? "No classes have been created yet."
                        : "Showing " +
                          classes.length +
                          " class" +
                          (classes.length === 1 ? "" : "es")}
                    </p>
                  </div>
                </div>

                <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  {currentSession?.name ?? "No current session"}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              {classes.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-background p-8 text-center sm:p-10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <GraduationCap className="h-6 w-6" />
                  </div>

                  <h3 className="mt-4 text-base font-bold">
                    No classes yet
                  </h3>

                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
                    Create your first class using the form beside this
                    list.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="group rounded-2xl border bg-background p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold tracking-tight">
                              {classItem.name}
                            </h3>

                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                classItem.status === "active"
                                  ? "bg-success/10 text-success"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {classItem.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-semibold text-primary">
                            {classItem.session_name}
                          </p>

                          <p className="mt-1.5 text-sm text-muted-foreground">
                            {classItem.capacity
                              ? `Capacity: ${classItem.capacity} students`
                              : "No fixed capacity"}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <ClassActions id={classItem.id} />
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
