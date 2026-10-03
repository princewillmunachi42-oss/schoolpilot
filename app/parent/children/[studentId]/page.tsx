"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
      <main className="min-h-screen p-4 sm:p-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-gray-500">
            Loading child information...
          </p>
        </div>
      </main>
    );
  }

  if (error || !child) {
    return (
      <main className="min-h-screen p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Link
            href="/parent"
            className="inline-flex text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Parent Dashboard
          </Link>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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

  const formattedDateOfBirth = child.date_of_birth
    ? child.date_of_birth.slice(0, 10)
    : "—";

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/parent"
          className="inline-flex text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Parent Dashboard
        </Link>

        <header className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-lg font-bold text-gray-700">
              {child.first_name.charAt(0)}
              {child.last_name.charAt(0)}
            </div>

            <div>
              <p className="text-sm text-gray-500">My Child</p>
              <h1 className="text-2xl font-bold text-gray-900">
                {fullName}
              </h1>

              {child.class_name && (
                <p className="mt-1 text-sm text-gray-500">
                  {child.class_name}
                  {child.class_level
                    ? ` • ${child.class_level}`
                    : ""}
                </p>
              )}
            </div>
          </div>
        </header>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Student Information
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Admission Number</p>
              <p className="mt-1 font-medium text-gray-900">
                {child.admission_number || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Class</p>
              <p className="mt-1 font-medium text-gray-900">
                {child.class_name || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="mt-1 font-medium capitalize text-gray-900">
                {child.gender || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="mt-1 font-medium text-gray-900">
                {formattedDateOfBirth}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Relationship</p>
              <p className="mt-1 font-medium capitalize text-gray-900">
                {child.relationship || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Contact Status</p>
              <p className="mt-1 font-medium text-gray-900">
                {child.is_primary_contact
                  ? "Primary Contact"
                  : "Linked Contact"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/parent/attendance?student=${child.id}`}
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">Attendance</h2>
            <p className="mt-1 text-sm text-gray-500">
              View attendance records.
            </p>
          </Link>

          <Link
            href={`/parent/results?student=${child.id}`}
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">Results</h2>
            <p className="mt-1 text-sm text-gray-500">
              View academic results.
            </p>
          </Link>

          <Link
            href={`/parent/timetable?student=${child.id}`}
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h2 className="font-semibold text-gray-900">Timetable</h2>
            <p className="mt-1 text-sm text-gray-500">
              View class timetable.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
