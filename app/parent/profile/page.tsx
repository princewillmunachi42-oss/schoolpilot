"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id: string;
  user_id: string;
  school_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  photo_url?: string | null;
  status: string;
};

type ApiResponse = {
  success: boolean;
  profile?: Profile;
  message?: string;
};

export default function ParentProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/parent/profile",
          {
            cache: "no-store",
          }
        );

        const result: ApiResponse =
          await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Failed to load your profile."
          );
        }

        setProfile(result.profile || null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load your profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/parent"
            className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Parent Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-bold">
            Parent Profile
          </h1>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            View your registered parent account information.
          </p>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            Loading profile...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : !profile ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            Profile information could not be found.
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.full_name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {profile.full_name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-semibold">
                    {profile.full_name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Parent
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      profile.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {profile.status}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h2 className="font-semibold">
                  Contact Information
                </h2>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Full Name
                  </p>
                  <p className="mt-1">
                    {profile.full_name || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 break-words">
                    {profile.email || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Phone
                  </p>
                  <p className="mt-1">
                    {profile.phone || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Address
                  </p>
                  <p className="mt-1">
                    {profile.address || "Not provided"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                <h2 className="font-semibold">
                  Account Information
                </h2>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Parent ID
                  </p>
                  <p className="mt-1 break-all text-sm">
                    {profile.id}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Account Status
                  </p>
                  <p className="mt-1 capitalize">
                    {profile.status}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
