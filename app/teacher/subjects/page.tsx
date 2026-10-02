"use client";

import { useEffect, useState } from "react";

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
        const response = await fetch("/api/teacher/subjects");

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

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <a href="/teacher" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            ← Back to Teacher Dashboard
          </a>
          <h1 className="text-2xl font-bold">My Subjects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Subjects assigned to you by your school administrator.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading your subjects...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && subjects.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              📚
            </div>

            <h2 className="text-lg font-semibold">No subjects assigned yet</h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Your school administrator has not assigned any subjects to you
              yet. Once a subject is assigned, it will appear here.
            </p>
          </div>
        )}

        {!loading && !error && subjects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {subject.subject_name}
                    </h2>

                    {subject.subject_code && (
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {subject.subject_code}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    Subject
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Class
                  </p>

                  {subject.class_id ? (
                    <div className="mt-1">
                      <p className="font-medium text-slate-800">
                        {subject.class_name}
                      </p>

                      {subject.class_level && (
                        <p className="mt-0.5 text-sm text-slate-500">
                          {subject.class_level}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 font-medium text-slate-700">
                      General / School-wide
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
