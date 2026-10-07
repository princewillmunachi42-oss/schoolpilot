"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Layers3,
} from "lucide-react";

type Subject = {
  id: string;
  subject_id: string;
  subject_name: string;
  subject_code: string | null;
  class_id: string | null;
  class_name: string | null;
  class_level: string | null;
};

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubjects() {
      try {
        setError("");

        const response = await fetch("/api/teacher/subjects", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load subjects");
        }

        const data = await response.json();
        setSubjects(data.subjects || []);
      } catch {
        setError("Unable to load your subjects.");
      } finally {
        setLoading(false);
      }
    }

    loadSubjects();
  }, []);

  const uniqueSubjects = new Set(
    subjects.map((subject) => subject.subject_id)
  ).size;

  const classAssignments = subjects.filter(
    (subject) => subject.class_id
  ).length;

  const generalAssignments = subjects.filter(
    (subject) => !subject.class_id
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
                <BookOpen className="h-4 w-4" />
                Teacher Portal
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                My Subjects
              </h1>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                View the subjects assigned to you across your school classes.
              </p>
            </div>

            {!loading && !error && (
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border bg-card px-4 py-2.5 text-sm font-medium shadow-sm">
                <Layers3 className="h-4 w-4 text-primary" />
                {subjects.length}{" "}
                {subjects.length === 1 ? "assignment" : "assignments"}
              </div>
            )}
          </div>
        </div>

        {!loading && !error && subjects.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Unique Subjects
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {uniqueSubjects}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    Class Assignments
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {classAssignments}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  <Layers3 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">
                    General Assignments
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {generalAssignments}
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
                  Unable to load subjects
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
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />

                      <div className="space-y-2">
                        <div className="h-5 w-28 animate-pulse rounded-lg bg-muted" />
                        <div className="h-3 w-16 animate-pulse rounded-lg bg-muted" />
                      </div>
                    </div>

                    <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
                  </div>

                  <div className="mt-6 h-20 animate-pulse rounded-xl bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ) : !error && subjects.length === 0 ? (
          <div className="rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No subjects assigned yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your school administrator has not assigned any subjects to you
              yet. Once a subject is assigned, it will appear here.
            </p>

            <Link
              href="/teacher"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              Return to Dashboard
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Assigned Subjects
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your current subject assignments.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <article
                  key={subject.id}
                  className="group rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <BookOpen className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold">
                          {subject.subject_name}
                        </h3>

                        {subject.subject_code ? (
                          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {subject.subject_code}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Subject code not set
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      Subject
                    </span>
                  </div>

                  <div className="mt-6 rounded-xl border bg-muted/40 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      Class
                    </div>

                    {subject.class_id ? (
                      <div className="mt-2">
                        <p className="font-semibold">
                          {subject.class_name}
                        </p>

                        {subject.class_level && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {subject.class_level}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 font-semibold">
                        General / School-wide
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="text-xs text-muted-foreground">
                      Teaching assignment
                    </span>

                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      Assigned
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
