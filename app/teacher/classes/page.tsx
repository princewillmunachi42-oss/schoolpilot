"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Users,
} from "lucide-react";

type TeacherClass = {
  id: string;
  name: string;
  level: string | null;
  capacity: number | null;
  status: string;
  is_primary: boolean;
};

export default function TeacherClassesPage() {
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadClasses() {
      try {
        setError("");

        const response = await fetch("/api/teacher/classes", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load classes.");
        }

        setClasses(data.classes || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load your classes."
        );
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, []);

  const primaryClasses = classes.filter(
    (teacherClass) => teacherClass.is_primary
  ).length;

  const activeClasses = classes.filter(
    (teacherClass) => teacherClass.status.toLowerCase() === "active"
  ).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <Link
            href="/teacher"
            className="mb-6 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Teacher Dashboard
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <GraduationCap className="h-4 w-4" />
                Teacher Portal
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                My Classes
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                View and manage the classes assigned to you by your school.
              </p>
            </div>

            {!loading && !error && (
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm">
                <Users className="h-4 w-4 text-primary" />
                {classes.length}{" "}
                {classes.length === 1 ? "class" : "classes"} assigned
              </div>
            )}
          </div>
        </div>

        {!loading && !error && classes.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Classes
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {classes.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Classes
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {activeClasses}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Primary Classes
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {primaryClasses}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <span className="font-bold">!</span>
              </div>

              <div>
                <h2 className="font-semibold text-destructive">
                  Unable to load classes
                </h2>

                <p className="mt-1 text-sm leading-6 text-destructive/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div>
            <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-muted" />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="h-6 w-32 animate-pulse rounded-lg bg-muted" />
                      <div className="h-4 w-20 animate-pulse rounded-lg bg-muted" />
                    </div>

                    <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="h-20 animate-pulse rounded-xl bg-muted" />
                    <div className="h-20 animate-pulse rounded-xl bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : classes.length === 0 && !error ? (
          <div className="rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No classes assigned yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              You do not currently have any classes assigned to you. Contact
              your school administrator if you believe this is incorrect.
            </p>

            <Link
              href="/teacher"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              Return to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Assigned Classes</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your current teaching assignments.
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((teacherClass) => {
                const isActive =
                  teacherClass.status.toLowerCase() === "active";

                return (
                  <article
                    key={teacherClass.id}
                    className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <GraduationCap className="h-6 w-6" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-semibold">
                            {teacherClass.name}
                          </h3>

                          {teacherClass.level ? (
                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {teacherClass.level}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-muted-foreground">
                              Assigned class
                            </p>
                          )}
                        </div>
                      </div>

                      {teacherClass.is_primary && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border bg-muted/40 p-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Capacity
                        </p>

                        <p className="mt-1 text-xl font-bold">
                          {teacherClass.capacity ?? "—"}
                        </p>
                      </div>

                      <div className="rounded-xl border bg-muted/40 p-4">
                        <p className="text-xs font-medium text-muted-foreground">
                          Status
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isActive
                                ? "bg-emerald-500"
                                : "bg-muted-foreground"
                            }`}
                          />

                          <p className="text-sm font-semibold capitalize">
                            {teacherClass.status}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t pt-4">
                      <span className="text-xs text-muted-foreground">
                        Teacher assignment
                      </span>

                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Assigned
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
