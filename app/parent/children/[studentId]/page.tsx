"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Hash,
  UserRound,
  Users,
  VenusAndMars,
  ChevronRight,
} from "lucide-react";

type Child = {
  id: string;
  first_name: string;
  last_name: string;
  other_name: string | null;
  admission_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  class_id: string | null;
  class_name: string | null;
  class_level: string | null;
  relationship: string | null;
  is_primary_contact: boolean;
};

export default function ParentChildPage() {
  const params = useParams();
  const studentId = String(params.studentId || "");

  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) {
      setError("Student ID is missing.");
      setLoading(false);
      return;
    }

    fetch(`/api/parent/children/${studentId}`)
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load child information."
          );
        }

        setChild(result.child);
      })
      .catch((err) => {
        setError(err.message || "Unable to load child information.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [studentId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="h-6 w-44 animate-pulse rounded-lg bg-muted" />

          <div className="h-56 animate-pulse rounded-3xl border bg-card" />

          <div className="h-72 animate-pulse rounded-3xl border bg-card" />

          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border bg-card"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !child) {
    return (
      <main className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <Link
            href="/parent"
            className="inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Parent Dashboard
          </Link>

          <div className="rounded-3xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
            {error || "Child information could not be found."}
          </div>
        </div>
      </main>
    );
  }

  const fullName = [
    child.first_name,
    child.other_name,
    child.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const initials =
    `${child.first_name.charAt(0)}${child.last_name.charAt(0)}`.toUpperCase();

  const formattedDateOfBirth = child.date_of_birth
    ? child.date_of_birth.slice(0, 10)
    : "—";

  const quickActions = [
    {
      title: "Attendance",
      description: "View attendance records.",
      href: `/parent/attendance?student=${child.id}`,
      icon: ClipboardCheck,
      iconStyle:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      title: "Results",
      description: "View academic results.",
      href: `/parent/results?student=${child.id}`,
      icon: GraduationCap,
      iconStyle:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
    },
    {
      title: "Timetable",
      description: "View class timetable.",
      href: `/parent/timetable?student=${child.id}`,
      icon: CalendarDays,
      iconStyle:
        "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
    },
  ];

  return (
    <main className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back */}
        <Link
          href="/parent"
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Parent Dashboard
        </Link>

        {/* Student Hero */}
        <header className="relative overflow-hidden rounded-3xl border bg-card">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative p-5 sm:p-7 lg:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-xl font-bold text-primary ring-8 ring-primary/5 sm:h-24 sm:w-24 sm:text-2xl">
                {initials}
              </div>

              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  <GraduationCap className="h-3.5 w-3.5" />
                  My Child
                </div>

                <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {fullName}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {child.class_name && (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" />
                      {child.class_name}
                    </span>
                  )}

                  {child.class_level && (
                    <>
                      <span className="text-border">•</span>
                      <span>{child.class_level}</span>
                    </>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {child.is_primary_contact ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Primary Contact
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      Linked Contact
                    </span>
                  )}

                  {child.relationship && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold capitalize">
                      <UserRound className="h-3.5 w-3.5 text-primary" />
                      {child.relationship}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Student Information */}
        <section className="rounded-3xl border bg-card">
          <div className="border-b px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold">Student Information</h2>
                <p className="text-sm text-muted-foreground">
                  Basic information about {child.first_name}.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Hash className="h-4 w-4" />
                Admission Number
              </div>

              <p className="mt-2 break-words font-semibold">
                {child.admission_number || "—"}
              </p>
            </div>

            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                Class
              </div>

              <p className="mt-2 break-words font-semibold">
                {child.class_name || "—"}
              </p>
            </div>

            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <VenusAndMars className="h-4 w-4" />
                Gender
              </div>

              <p className="mt-2 font-semibold capitalize">
                {child.gender || "—"}
              </p>
            </div>

            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Date of Birth
              </div>

              <p className="mt-2 font-semibold">
                {formattedDateOfBirth}
              </p>
            </div>

            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Users className="h-4 w-4" />
                Relationship
              </div>

              <p className="mt-2 font-semibold capitalize">
                {child.relationship || "—"}
              </p>
            </div>

            <div className="bg-card p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Contact Status
              </div>

              <p className="mt-2 font-semibold">
                {child.is_primary_contact
                  ? "Primary Contact"
                  : "Linked Contact"}
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight">
              Academic Overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Quickly access important information for {child.first_name}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-2xl border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.iconStyle}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="mt-4 font-semibold">
                    {action.title}
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {action.description}
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
