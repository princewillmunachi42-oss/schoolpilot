"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function StudentChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/student/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to change password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setMessage("Your password has been changed successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <Link
          href="/student/profile"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to My Profile
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Account Security
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Change Password
        </h1>

        <p className="mt-2 text-muted-foreground">
          Change the password you use to sign in to your Student Portal.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border bg-card p-6"
      >
        <div>
          <label className="mb-2 block text-sm font-medium">
            Current Password
          </label>

          <input
            required
            type="password"
            value={currentPassword}
            onChange={(event) =>
              setCurrentPassword(event.target.value)
            }
            autoComplete="current-password"
            className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            New Password
          </label>

          <input
            required
            type="password"
            value={newPassword}
            onChange={(event) =>
              setNewPassword(event.target.value)
            }
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
          />

          <p className="mt-2 text-xs text-muted-foreground">
            Use at least 8 characters.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Confirm New Password
          </label>

          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            autoComplete="new-password"
            minLength={8}
            className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-foreground px-4 py-3 font-semibold text-background disabled:opacity-50"
        >
          {loading ? "Changing password..." : "Change Password"}
        </button>
      </form>
    </section>
  );
}
