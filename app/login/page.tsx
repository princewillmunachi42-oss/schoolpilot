"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Invalid email or password.");
        return;
      }
const role = data.memberships?.[0]?.role;

if (role === "student") {
  window.location.href = "/student";
} else if (role === "parent") {
  window.location.href = "/parent";
} else {
  window.location.href = "/dashboard";
}

    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <a href="/" className="text-2xl font-bold">
            SchoolPilot
          </a>

          <h1 className="mt-8 text-3xl font-bold">
            Welcome back
          </h1>

          <p className="mt-2 text-muted-foreground">
            Sign in to manage your school.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border p-6 shadow-sm"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              required
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full rounded-lg border bg-transparent px-4 py-3 outline-none focus:ring-2"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-foreground px-4 py-3 font-semibold text-background disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have a school account?{" "}
            <a href="/signup" className="font-medium text-foreground">
              Create one
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
