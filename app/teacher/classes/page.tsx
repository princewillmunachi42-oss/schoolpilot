"use client";

import { useEffect, useState } from "react";

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

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="mb-8">
          <a href="/teacher" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            ← Back to Teacher Dashboard
          </a>
          <p className="text-sm font-medium text-primary">
            Teacher Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Classes
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View the classes assigned to you.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Loading your classes...
            </p>
          </div>
        ) : classes.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl">
              📚
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No classes assigned yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              You do not currently have any classes assigned to you.
              Contact your school administrator if you believe this is incorrect.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((teacherClass) => (
              <article
                key={teacherClass.id}
                className="rounded-2xl border bg-card p-6 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {teacherClass.name}
                    </h2>

                    {teacherClass.level && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {teacherClass.level}
                      </p>
                    )}
                  </div>

                  {teacherClass.is_primary && (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      Primary
                    </span>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">
                      Capacity
                    </p>

                    <p className="mt-1 text-lg font-semibold">
                      {teacherClass.capacity ?? "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">
                      Status
                    </p>

                    <p className="mt-1 text-lg font-semibold capitalize">
                      {teacherClass.status}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
