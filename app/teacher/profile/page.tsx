"use client";

import { useEffect, useState } from "react";

type Profile = {
  staff_id: string;
  first_name: string | null;
  last_name: string | null;
  other_name: string | null;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  photo_url: string | null;
  status: string;
};

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/teacher/profile", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load profile."
          );
        }

        setProfile(data.profile);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function displayValue(value: string | null) {
    return value?.trim() || "Not provided";
  }

  function fullName() {
    if (!profile) return "";

    return [
      profile.first_name,
      profile.other_name,
      profile.last_name,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <a
          href="/teacher"
          className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          ← Back to Teacher Dashboard
        </a>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your teacher account and staff information.
          </p>
        </div>

        {loading && (
          <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
            Loading profile...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="text-sm font-medium text-destructive">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && profile && (
          <div className="space-y-6">
            <section className="rounded-xl border bg-card p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-bold">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={fullName()}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>
                      {(profile.first_name?.[0] || "T").toUpperCase()}
                      {(profile.last_name?.[0] || "").toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-xl font-semibold">
                    {fullName() || "Teacher"}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {displayValue(profile.role_title)}
                  </p>

                  <span className="mt-3 inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                    {profile.status}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-card">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold">
                  Personal Information
                </h2>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    First Name
                  </p>
                  <p className="mt-1 text-sm">
                    {displayValue(profile.first_name)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Last Name
                  </p>
                  <p className="mt-1 text-sm">
                    {displayValue(profile.last_name)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Other Name
                  </p>
                  <p className="mt-1 text-sm">
                    {displayValue(profile.other_name)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Phone
                  </p>
                  <p className="mt-1 text-sm">
                    {displayValue(profile.phone)}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1 break-words text-sm">
                    {displayValue(profile.email)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border bg-card">
              <div className="border-b px-6 py-4">
                <h2 className="font-semibold">
                  Staff Information
                </h2>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Staff ID
                  </p>
                  <p className="mt-1 break-all font-mono text-sm">
                    {displayValue(profile.staff_id)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Role / Title
                  </p>
                  <p className="mt-1 text-sm">
                    {displayValue(profile.role_title)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Account Status
                  </p>
                  <p className="mt-1 text-sm capitalize">
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
