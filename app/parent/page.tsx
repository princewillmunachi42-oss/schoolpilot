"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  GraduationCap,
  LogOut,
  MessageSquare,
  UserRound,
  Users,
  ClipboardCheck,
} from "lucide-react";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  admission_number: string | null;
  class_name: string | null;
  relationship: string | null;
  is_primary_contact: boolean;
};

type DashboardData = {
  parent: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  };
  children: Child[];
};

export default function ParentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/parent/dashboard")
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load parent dashboard."
          );
        }

        const notificationsResponse = await fetch(
          "/api/parent/notifications?unread=true"
        );

        if (notificationsResponse.ok) {
          const notifications = await notificationsResponse.json();
          setUnreadCount(Number(notifications.unreadCount ?? 0));
        }

        setData(result);
      })
      .catch((err) => {
        setError(err.message || "Unable to load parent dashboard.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-44 animate-pulse rounded-3xl border bg-card" />

          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl border bg-card"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const parentInitials = data.parent.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");

  const quickLinks = [
    {
      title: "Attendance",
      description: "Monitor your children's attendance records.",
      href: "/parent/attendance",
      icon: ClipboardCheck,
      iconStyle:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      title: "Results",
      description: "Review academic performance and results.",
      href: "/parent/results",
      icon: BookOpen,
      iconStyle:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    },
    {
      title: "Fees",
      description: "View fee records and payment information.",
      href: "/parent/fees",
      icon: CircleDollarSign,
      iconStyle:
        "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
    {
      title: "Timetable",
      description: "View your children's weekly timetables.",
      href: "/parent/timetable",
      icon: CalendarDays,
      iconStyle:
        "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
    },
    {
      title: "Communications",
      description: "View school messages and updates.",
      href: "/parent/communications",
      icon: MessageSquare,
      iconStyle:
        "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      title: "My Profile",
      description: "View your parent account information.",
      href: "/parent/profile",
      icon: UserRound,
      iconStyle:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
  ];

  return (
    <main className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Responsive Header */}
        <header className="relative overflow-visible rounded-3xl border bg-card">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative p-4 sm:p-6 lg:p-7">
            {/* Top section */}
            <div className="flex flex-col gap-5">
              <div className="min-w-0">
                <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>Parent Portal</span>
                </div>

                <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  Welcome, {data.parent.fullName}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Stay connected with your children's academic progress,
                  attendance, fees, timetable, and school communications.
                </p>
              </div>

              {/* Controls */}
              <div className="flex w-full items-center justify-between gap-3 border-t pt-4 sm:justify-end sm:border-t-0 sm:pt-0">
                <div className="min-w-0 sm:hidden">
                  <p className="truncate text-sm font-semibold">
                    {data.parent.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Parent account
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Notifications */}
                  <Link
                    href="/parent/notifications"
                    aria-label="Notifications"
                    className="relative flex h-11 w-11 items-center justify-center rounded-xl border bg-background text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  >
                    <Bell className="h-5 w-5" />

                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* Profile */}
                  <div ref={profileMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setProfileMenuOpen((open) => !open)
                      }
                      aria-expanded={profileMenuOpen}
                      aria-haspopup="menu"
                      className="flex h-11 items-center gap-2 rounded-xl border bg-background px-1.5 pr-2 transition hover:border-primary/30 hover:bg-primary/5 sm:gap-3 sm:px-2"
                    >
                      <div className="hidden text-right md:block">
                        <p className="max-w-40 truncate text-sm font-semibold">
                          {data.parent.fullName}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Parent
                        </p>
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary sm:h-10 sm:w-10 sm:text-sm">
                        {parentInitials}
                      </div>
                    </button>

                    {profileMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-64 rounded-2xl border bg-card p-2 shadow-xl sm:w-56"
                      >
                        <div className="mb-2 border-b px-3 py-2.5">
                          <p className="truncate text-sm font-semibold">
                            {data.parent.fullName}
                          </p>

                          {data.parent.email && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {data.parent.email}
                            </p>
                          )}
                        </div>

                        <Link
                          href="/parent/profile"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-muted"
                        >
                          <UserRound className="h-4 w-4" />
                          My Profile
                        </Link>

                        <form
                          action="/api/auth/logout"
                          method="POST"
                        >
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive transition hover:bg-destructive/10"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Children */}
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                My Children
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Children currently linked to your parent account.
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />

              {data.children.length}{" "}
              {data.children.length === 1 ? "child" : "children"}
            </div>
          </div>

          {data.children.length === 0 ? (
            <div className="rounded-3xl border bg-card p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <GraduationCap className="h-7 w-7" />
              </div>

              <h3 className="mt-4 font-semibold">
                No children linked
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                No active children are currently linked to your parent
                account.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.children.map((child) => {
                const fullName = [
                  child.first_name,
                  child.other_name,
                  child.last_name,
                ]
                  .filter(Boolean)
                  .join(" ");

                const initials =
                  `${child.first_name.charAt(
                    0
                  )}${child.last_name.charAt(0)}`.toUpperCase();

                return (
                  <article
                    key={child.id}
                    className="group rounded-3xl border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-bold">
                            {fullName}
                          </h3>

                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {child.class_name || "Class not assigned"}
                          </p>
                        </div>
                      </div>

                      <GraduationCap className="h-5 w-5 shrink-0 text-primary/60" />
                    </div>

                    <div className="mt-5 space-y-3 rounded-2xl bg-muted/50 p-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">
                          Admission Number
                        </span>

                        <span className="text-right font-semibold">
                          {child.admission_number || "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">
                          Relationship
                        </span>

                        <span className="font-semibold capitalize">
                          {child.relationship || "—"}
                        </span>
                      </div>

                      {child.is_primary_contact && (
                        <div className="pt-1">
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                            Primary Contact
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t pt-4">
                      <Link
                        href={`/parent/children/${child.id}`}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10"
                      >
                        View Child
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Access */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight">
              Quick Access
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Access the most important areas of your parent portal.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconStyle}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="mt-4 font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
