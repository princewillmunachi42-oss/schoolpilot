import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Settings,
  School,
  ShieldCheck,
  Users,
  UserRound,
  LogOut,
  ArrowUpDown,
  BookMarked,
  Clock3,
} from "lucide-react";

import { redirect } from "next/navigation";
import MobileDashboardNav from "@/components/MobileDashboardNav";
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
    icon: GraduationCap,
  },
  {
    label: "Staff",
    value: counts.staff,
    href: "/dashboard/staff",
    icon: Users,
  },
  {
    label: "Classes",
    value: counts.classes,
    href: "/dashboard/classes",
    icon: School,
  },
  {
    label: "Subjects",
    value: counts.subjects,
    href: "/dashboard/subjects",
    icon: BookOpen,
  },
];

  const navigationGroups: {
    label: string;
    items: {
      label: string;
      href: string;
      icon: typeof LayoutDashboard;
      active?: boolean;
    }[];
  }[] = [
    {
      label: "Overview",
      items: [
        {
          label: "Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
          active: true,
        },
      ],
    },
    {
      label: "Academic",
      items: [
        {
          label: "Academic Sessions",
          href: "/dashboard/sessions",
          icon: CalendarDays,
        },
        {
          label: "Terms",
          href: "/dashboard/terms",
          icon: BookOpen,
        },
        {
          label: "Classes",
          href: "/dashboard/classes",
          icon: GraduationCap,
        },
        {
          label: "Subjects",
          href: "/dashboard/subjects",
          icon: BookMarked,
        },
        {
          label: "Timetable",
          href: "/dashboard/timetable",
          icon: Clock3,
        },
        {
          label: "Timetable Periods",
          href: "/dashboard/timetable-periods",
          icon: CalendarDays,
        },
      ],
    },
    {
      label: "People",
      items: [
        {
          label: "Staff",
          href: "/dashboard/staff",
          icon: Users,
        },
        {
          label: "Students",
          href: "/dashboard/students",
          icon: GraduationCap,
        },
        {
          label: "Parents",
          href: "/dashboard/parents",
          icon: UserRound,
        },
        {
          label: "Student Promotions",
          href: "/dashboard/promotions",
          icon: ArrowUpDown,
        },
        {
          label: "Class Progressions",
          href: "/dashboard/class-progressions",
          icon: ArrowUpDown,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          label: "Teacher Assignments",
          href: "/dashboard/teacher-assignments",
          icon: ClipboardList,
        },
        {
          label: "Student Fees",
          href: "/dashboard/fees",
          icon: CircleDollarSign,
        },
        {
          label: "Announcements",
          href: "/dashboard/announcements",
          icon: Megaphone,
        },
        {
          label: "Communications",
          href: "/dashboard/communications",
          icon: MessageSquare,
        },
        {
          label: "School Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r bg-card lg:flex lg:flex-col">
          <div className="border-b px-5 py-5">
            <a href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="font-bold tracking-tight">SchoolPilot</p>
                <p className="text-xs text-muted-foreground">
                  School management
                </p>
              </div>
            </a>
          </div>

          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {membership.school_name}
                </p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {membership.school_email}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navigationGroups.map((group) => (
              <div key={group.label} className="mb-6 last:mb-0">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;

                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          item.active ?? false
                            ? "bg-primary text-white shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t p-4">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        {/* Main area */}
        <div className="min-w-0 flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-xl">
            <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 sm:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white lg:hidden">
                  S
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold lg:text-base">
                    Overview
                  </p>

                  <p className="hidden truncate text-xs text-muted-foreground sm:block lg:hidden">
                    {membership.school_name}
                  </p>

                  <p className="hidden text-sm font-medium text-muted-foreground lg:block">
                    School overview and administration
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Notifications"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-sm transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                >
                  <Bell className="h-5 w-5" />
                </button>

                <details className="relative">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-transparent p-1.5 transition-all hover:border-border hover:bg-card hover:shadow-sm">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold">
                        {user.first_name} {user.last_name}
                      </p>

                      <p className="text-xs capitalize text-muted-foreground">
                        {membership.role}
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white shadow-sm">
                      {user.first_name.charAt(0)}
                      {user.last_name.charAt(0)}
                    </div>

                    <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
                  </summary>

                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border bg-card p-2 shadow-xl">
                    <div className="border-b px-3 py-2.5 sm:hidden">
                      <p className="text-sm font-semibold">
                        {user.first_name} {user.last_name}
                      </p>

                      <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                        {membership.role}
                      </p>
                    </div>

                    <form action="/api/auth/logout" method="POST">
                      <button
                        type="submit"
                        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium hover:bg-muted"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </form>
                  </div>
                </details>
              </div>
            </div>

            <MobileDashboardNav />
          </header>

          {/* Dashboard content */}
          <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
            <div className="flex flex-col justify-between gap-6 rounded-3xl border bg-card p-6 shadow-sm sm:p-7 lg:flex-row lg:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <LayoutDashboard className="h-4 w-4" />
                  </div>
                  School Overview
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  Welcome back, {user.first_name}
                </h1>

                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Here's what's happening with your school today.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border bg-muted/40 px-4 py-3.5 sm:min-w-[230px]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Current academic period
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold">
                    {academic?.session_name ?? "Not configured"}
                  </p>

                  {academic?.term_name && (
                    <p className="text-xs text-muted-foreground">
                      {academic.term_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  className="group rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        {card.label}
                      </p>

                      <p className="mt-2 text-3xl font-bold tracking-tight">
                        {card.value}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-white">
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="text-xs font-semibold text-primary">
                      View details
                    </span>

                    <span className="text-sm text-muted-foreground transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </a>
              ))}
            </div>

            {/* Quick actions */}
            <div className="mt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    Quick actions
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Manage your school
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  {
                    label: "Add student",
                    description: "Manage students",
                    href: "/dashboard/students",
                    icon: GraduationCap,
                  },
                  {
                    label: "Add staff",
                    description: "Manage staff",
                    href: "/dashboard/staff",
                    icon: Users,
                  },
                  {
                    label: "Create class",
                    description: "Manage classes",
                    href: "/dashboard/classes",
                    icon: School,
                  },
                  {
                    label: "Manage subjects",
                    description: "Manage subjects",
                    href: "/dashboard/subjects",
                    icon: BookOpen,
                  },
                ].map((action) => {
                  const Icon = action.icon;

                  return (
                    <a
                      key={action.label}
                      href={action.href}
                      className="group rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-sm font-semibold">
                        {action.label}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>

                        <span className="shrink-0 text-sm text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-primary">
                          →
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* School information */}
            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md lg:col-span-2 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Building2 className="h-6 w-6" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        Your school
                      </p>

                      <h2 className="mt-1 truncate text-xl font-bold">
                        {membership.school_name}
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        School profile and account information
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize text-primary">
                    {membership.role}
                  </span>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      School email
                    </p>

                    <p className="mt-2 break-all text-sm font-semibold">
                      {membership.school_email}
                    </p>
                  </div>

                  <div className="rounded-2xl border bg-muted/40 p-4">
                    <p className="text-xs font-medium text-muted-foreground">
                      Account owner
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {user.first_name} {user.last_name}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end border-t pt-5">
                  <a
                    href="/dashboard/settings"
                    className="group inline-flex items-center rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-sm font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/10"
                  >
                    School settings
                    <span className="ml-1.5 transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </a>
                </div>
              </div>

              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-6 text-white shadow-lg shadow-primary/10 sm:p-7">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <CalendarDays className="h-5 w-5" />
                  </div>

                  <p className="mt-5 text-sm font-medium text-white/70">
                    Academic session
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {academic?.session_name ?? "Not configured"}
                  </h2>

                  <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4">
                    <p className="text-xs font-medium text-white/60">
                      Current term
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      {academic?.term_name ?? "Not configured"}
                    </p>
                  </div>

                  <a
                    href="/dashboard/sessions"
                    className="mt-5 inline-flex items-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white/90"
                  >
                    {academic?.session_name ? "Manage academics" : "Configure academics"}
                    <span className="ml-1.5">→</span>
                  </a>
                </div>
              </div>

          </section>
        </div>
      </div>
    </main>
  );
}
