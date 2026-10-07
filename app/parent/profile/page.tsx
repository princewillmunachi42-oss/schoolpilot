"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react";

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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ParentProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/parent/profile", {
        cache: "no-store",
      });

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Failed to load your profile.",
        );
      }

      setProfile(result.profile || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-5 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Header */}
        <header className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          <div className="relative p-5 sm:p-7">
            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[var(--primary)] opacity-10 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-[var(--accent)] opacity-10 blur-3xl" />

            <div className="relative">
              <Link
                href="/parent"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition hover:opacity-80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Parent Dashboard
              </Link>

              <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                    <UserRound className="h-3.5 w-3.5" />
                    Parent Portal
                  </div>

                  <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                    My Profile
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
                    View the parent account information registered
                    with your school.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadProfile}
                  disabled={loading}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${
                      loading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Loading */}
        {loading ? (
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10">
                <RefreshCw className="h-5 w-5 animate-spin text-[var(--primary)]" />
              </div>

              <div>
                <p className="font-semibold">
                  Loading your profile
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Fetching your registered account information...
                </p>
              </div>
            </div>
          </section>
        ) : error ? (
          <section className="rounded-3xl border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--destructive)]" />

              <div>
                <p className="font-semibold text-[var(--destructive)]">
                  Unable to load profile
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={loadProfile}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try again
                </button>
              </div>
            </div>
          </section>
        ) : !profile ? (
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--muted)]">
              <User className="h-7 w-7 text-[var(--muted-foreground)]" />
            </div>

            <h2 className="mt-4 font-bold">
              Profile information not found
            </h2>

            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Your registered parent profile could not be found.
            </p>
          </section>
        ) : (
          <>
            {/* Profile Hero */}
            <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--accent)]/10 p-5 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.full_name}
                      className="h-24 w-24 rounded-3xl border-4 border-[var(--card)] object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-[var(--primary)] text-2xl font-bold text-white shadow-md">
                      {getInitials(profile.full_name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {profile.full_name}
                      </h2>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                          profile.status === "active"
                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                            : "bg-[var(--muted)] text-[var(--muted-foreground)]"
                        }`}
                      >
                        {profile.status === "active" && (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        {profile.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Registered Parent
                    </p>

                    <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">
                      This profile contains the contact information
                      associated with your parent account.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                    <UserRound className="h-5 w-5 text-[var(--primary)]" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Contact Information
                    </h2>

                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      Your registered contact details
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <InfoCard
                  icon={User}
                  label="Full Name"
                  value={profile.full_name}
                />

                <InfoCard
                  icon={Mail}
                  label="Email"
                  value={profile.email}
                  breakWords
                />

                <InfoCard
                  icon={Phone}
                  label="Phone"
                  value={profile.phone}
                />

                <InfoCard
                  icon={MapPin}
                  label="Address"
                  value={profile.address}
                  breakWords
                />
              </div>
            </section>

            {/* Account Information */}
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
              <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                    <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Account Information
                    </h2>

                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      System account details
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                <InfoCard
                  icon={ShieldCheck}
                  label="Account Status"
                  value={profile.status}
                  capitalize
                />

                <InfoCard
                  icon={User}
                  label="Parent ID"
                  value={profile.id}
                  breakWords
                />
              </div>
            </section>

            {/* Read-only notice */}
            <div className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />

                <div>
                  <p className="text-sm font-semibold">
                    Profile information is read-only
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                    Contact your school administrator if any of
                    your registered information needs to be updated.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  breakWords = false,
  capitalize = false,
}: {
  icon: typeof User;
  label: string;
  value?: string | null;
  breakWords?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--muted)]/35 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--primary)]" />

        <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
          {label}
        </p>
      </div>

      <p
        className={`mt-3 text-sm font-semibold ${
          breakWords ? "break-words" : ""
        } ${capitalize ? "capitalize" : ""}`}
      >
        {value || "Not provided"}
      </p>
    </div>
  );
}
