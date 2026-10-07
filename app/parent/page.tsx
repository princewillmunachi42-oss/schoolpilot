"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

  useEffect(() => {
    fetch("/api/parent/dashboard")
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load parent dashboard.");
        }

          const notificationsResponse = await fetch("/api/parent/notifications?unread=true");
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

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-gray-500">Loading parent dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border bg-white p-5 shadow-sm">
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-sm text-gray-500">Parent Portal</p>
      <h1 className="mt-1 text-2xl font-bold text-gray-900">
        Welcome, {data.parent.fullName}
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        View and manage information connected to your children.
      </p>
    </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/parent/notifications"
          aria-label="Notifications"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-gray-100"
        >
          <span className="text-lg">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>

        <details className="relative shrink-0">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">
                {data.parent.fullName}
              </p>
              <p className="text-xs text-gray-500">Parent</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
              {data.parent.fullName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((name) => name.charAt(0).toUpperCase())
                .join("")}
            </div>
          </summary>

          <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border bg-white p-2 shadow-lg">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </form>
          </div>
        </details>
      </div>
    </div>
  </header>
          
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                My Children
              </h2>
              <p className="text-sm text-gray-500">
                Children currently linked to your parent account.
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {data.children.length}{" "}
              {data.children.length === 1 ? "child" : "children"}
            </span>
          </div>

          {data.children.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
              No active children are currently linked to your account.
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

                return (
                  <article
                    key={child.id}
                    className="rounded-2xl border bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {fullName}
                        </h3>

                        {child.class_name && (
                          <p className="mt-1 text-sm text-gray-500">
                            {child.class_name}
                          </p>
                        )}
                      </div>

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                        {child.first_name.charAt(0)}
                        {child.last_name.charAt(0)}
                      </div>
                    </div>

                    <div className="mt-5 space-y-2 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">
                          Admission Number
                        </span>
                        <span className="font-medium text-gray-900">
                          {child.admission_number || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">Relationship</span>
                        <span className="font-medium capitalize text-gray-900">
                          {child.relationship || "—"}
                        </span>
                      </div>

                      {child.is_primary_contact && (
                        <div className="pt-2">
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            Primary Contact
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t pt-4">
                      <Link
                        href={`/parent/children/${child.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View Child
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/parent/attendance"
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">Attendance</h3>
            <p className="mt-1 text-sm text-gray-500">
              View your children&apos;s attendance.
            </p>
          </Link>

          <Link
            href="/parent/results"
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">Results</h3>
            <p className="mt-1 text-sm text-gray-500">
              View academic results.
            </p>
          </Link>

          <Link
            href="/parent/fees"
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">Fees</h3>
            <p className="mt-1 text-sm text-gray-500">
              View fee information.

              </p>
            </Link>
           <Link
            href="/parent/profile"
            className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">My Profile</h3>
            <p className="mt-1 text-sm text-gray-500">
              View your parent profile.
            </p>
          </Link>
         <Link
  href="/parent/timetable"
  className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
>
  <h3 className="font-semibold text-gray-900">
    Timetable
  </h3>

  <p className="mt-1 text-sm text-gray-500">
    View your child&apos;s weekly class timetable.
  </p>
</Link>
<Link
  href="/parent/communications"
  className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
>
  <h3 className="font-semibold text-gray-900">
    Communications
  </h3>

  <p className="mt-1 text-sm text-gray-500">
    View messages, announcements, and assignments from the school.
  </p>
</Link>
        </section>
      </div>
    </main>
  );
}
