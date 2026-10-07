"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[1fr_0.85fr]">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-primary lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
          </div>

          <div className="relative flex w-full flex-col justify-between p-10 xl:p-14">
            <Link
              href="/"
              className="inline-flex w-fit items-center gap-2.5 text-white"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <GraduationCap className="h-5 w-5" />
              </div>

              <span className="text-xl font-bold tracking-tight">
                SchoolPilot
              </span>
            </Link>

            <div className="max-w-lg">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur">
                <ShieldCheck className="h-7 w-7" />
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Your school,
                <br />
                organized.
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-indigo-100">
                Access your SchoolPilot workspace and manage the people,
                academics and everyday operations that keep your school
                moving.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Manage your school from one workspace",
                  "Keep school information organized",
                  "Give each role the access it needs",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-indigo-100"
                  >
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                      <ShieldCheck className="h-3.5 w-3.5 text-white" />
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-indigo-200">
              Secure access to your school workspace.
            </p>
          </div>
        </section>

        {/* Login panel */}
        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to SchoolPilot
            </Link>

            <div className="mb-8 lg:mb-9">
              <Link
                href="/"
                className="mb-7 hidden items-center gap-2.5 lg:inline-flex"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <span className="text-lg font-bold tracking-tight">
                  School<span className="text-primary">Pilot</span>
                </span>
              </Link>

              <h2 className="text-3xl font-bold tracking-tight">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sign in to continue to your school workspace.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7"
            >
              <div className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />

                    <input
                      id="email"
                      required
                      type="text"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="min-h-12 w-full rounded-xl border bg-background py-3 pl-11 pr-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold"
                    >
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />

                    <input
                      id="password"
                      required
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      className="min-h-12 w-full rounded-xl border bg-background py-3 pl-11 pr-11 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4.5 w-4.5" />
                      ) : (
                        <Eye className="h-4.5 w-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-5 text-destructive"
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Signing in..." : "Sign in"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>

              <div className="mt-6 flex items-start gap-2 rounded-xl bg-muted/60 p-3.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                <p className="text-xs leading-5 text-muted-foreground">
                  Your access is determined by your school role after
                  successful sign in.
                </p>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have a school account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Create one
                </Link>
              </p>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link
                href="/"
                className="transition-colors hover:text-foreground"
              >
                © 2026 SchoolPilot
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
