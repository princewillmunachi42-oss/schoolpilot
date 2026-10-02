import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membershipResult = await pool.query(
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

  const membership = membershipResult.rows[0];

    if (!membership) {
    redirect("/login");
  }

  if (membership.role === "teacher") {
    redirect("/teacher");
  }

  const schoolId = membership.school_id;

  const countsResult = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM students WHERE school_id = $1) AS students,
       (SELECT COUNT(*) FROM staff WHERE school_id = $1) AS staff,
       (SELECT COUNT(*) FROM classes WHERE school_id = $1) AS classes,
       (SELECT COUNT(*) FROM subjects WHERE school_id = $1) AS subjects`,
    [schoolId]
  );

  const counts = countsResult.rows[0];

  const academicResult = await pool.query(
    `SELECT
       ac.id AS session_id,
       ac.name AS session_name,
       t.name AS term_name
     FROM academic_sessions ac
     LEFT JOIN terms t
       ON t.academic_session_id = ac.id
       AND t.is_current = true
     WHERE ac.school_id = $1
       AND ac.is_current = true
     LIMIT 1`,
    [schoolId]
  );

  const academic = academicResult.rows[0];

  const statCards = [
  {
    label: "Students",
    value: counts.students,
    href: "/dashboard/students",
    icon: "ST",
  },
  {
    label: "Staff",
    value: counts.staff,
    href: "/dashboard/staff",
    icon: "SF",
  },
  {
    label: "Classes",
    value: counts.classes,
    href: "/dashboard/classes",
    icon: "CL",
  },
  {
    label: "Subjects",
    value: counts.subjects,
    href: "/dashboard/subjects",
    icon: "SB",
  },
];

  const navigation = [
    { label: "Overview", href: "/dashboard", active: true },
    { label: "School Settings", href: "/dashboard/settings" },
    { label: "Academic Sessions", href: "/dashboard/sessions" },
    { label: "Terms", href: "/dashboard/terms" },
    { label: "Classes", href: "/dashboard/classes" },
    { label: "Subjects", href: "/dashboard/subjects" },
    { label: "Staff", href: "/dashboard/staff" },
    { label: "Students", href: "/dashboard/students" }, 
    { label: "Parents", href: "/dashboard/parents" },
    { label: "Teacher Assignments", href: "/dashboard/teacher-assignments" },
    { label: "Timetable", href: "/dashboard/timetable" },
{ label: "Timetable Periods", href: "/dashboard/timetable-periods" },
{ label: "Announcements", href: "/dashboard/announcements" },
];
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
          <div className="border-b p-5">
            <a href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-white">
                S
              </div>

              <div>
                <p className="font-bold tracking-tight">
                  SchoolPilot
                </p>

                <p className="text-xs text-muted-foreground">
                  School Management
                </p>
              </div>
            </a>
          </div>

          <div className="border-b p-4">
            <p className="truncate text-sm font-semibold">
              {membership.school_name}
            </p>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {membership.school_email}
            </p>
          </div>

          <nav className="flex-1 space-y-1 p-3">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="border-t p-4">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Main area */}
        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-white lg:hidden">
                  S
                </div>

                <div>
                  <p className="text-sm font-semibold lg:hidden">
                    SchoolPilot
                  </p>

                  <p className="hidden text-sm font-medium text-muted-foreground lg:block">
                    Overview
                  </p>
                </div>
              </div>

              <details className="relative">
  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-1 hover:bg-muted">
    <div className="hidden text-right sm:block">
      <p className="text-sm font-semibold">
        {user.first_name} {user.last_name}
      </p>

      <p className="text-xs capitalize text-muted-foreground">
        {membership.role}
      </p>
    </div>

    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
      {user.first_name.charAt(0)}
      {user.last_name.charAt(0)}
    </div>
  </summary>

  <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border bg-card p-2 shadow-lg">
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted"
      >
        Logout
      </button>
    </form>
  </div>
</details>
</div>
            {/* Mobile navigation */}
            <div className="overflow-x-auto border-t lg:hidden">
              <nav className="flex min-w-max gap-1 p-2">
                {navigation.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      item.active
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </header>

          {/* Dashboard content */}
          <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-primary">
                  School Overview
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome back, {user.first_name}
                </h1>

                <p className="mt-2 text-muted-foreground">
                  Here's what's happening with your school.
                </p>
              </div>

              <div className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  Current academic period
                </p>

                <p className="mt-1 text-sm font-semibold">
                  {academic?.session_name ?? "Not configured"}
                </p>

                {academic?.term_name && (
                  <p className="text-xs text-muted-foreground">
                    {academic.term_name}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {card.label}
                      </p>

                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {card.value}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      {card.icon}
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-medium text-primary">
                    Manage {card.label.toLowerCase()} →
                  </p>
                </a>
              ))}
            </div>

            {/* School information */}
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border bg-card p-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Your school
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      {membership.school_name}
                    </h2>
                  </div>

                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
                    {membership.role}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/60 p-4">
                    <p className="text-xs text-muted-foreground">
                      School email
                    </p>

                    <p className="mt-1 break-all text-sm font-medium">
                      {membership.school_email}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/60 p-4">
                    <p className="text-xs text-muted-foreground">
                      Account owner
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 text-white shadow-lg shadow-primary/10">
                <p className="text-sm font-medium text-white/70">
                  Academic session
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {academic?.session_name ?? "Not configured"}
                </h2>

                <p className="mt-2 text-sm text-white/70">
                  {academic?.term_name
                    ? `Current term: ${academic.term_name}`
                    : "Set up your academic session and current term."}
                </p>

                <a
                  href="#"
                  className="mt-6 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/90"
                >
                  Configure academics
                </a>
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-8 rounded-2xl border bg-card p-6">
              <div>
                <p className="text-sm font-medium text-primary">
                  Quick actions
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Get started with SchoolPilot
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  Set up the core information your school needs to get started.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Set up session", "/dashboard/sessions"],
                  ["Create classes", "/dashboard/classes"],
                  ["Add subjects", "Subjects"],
                  ["Add staff", "Staff"],
                ].map(([action, destination]) => (
                  <a
                    key={action}
                    href="#"
                    className="rounded-xl border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <p className="text-sm font-semibold">{action}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {destination}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
