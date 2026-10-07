"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default function SignupPage() {
  const [form, setForm] = useState({
    schoolName: "",
    schoolEmail: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to create your account.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.82fr_1fr]">
        {/* Brand panel */}
        <section className="relative hidden overflow-hidden bg-primary lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -right-32 -top-32 h-[430px] w-[430px] rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-24 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-3xl" />
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

            <div className="max-w-md">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur">
                <Building2 className="h-7 w-7" />
              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Build a better
                <br />
                school workspace.
              </h1>

              <p className="mt-5 text-base leading-7 text-indigo-100">
                Create your school account and bring your academic,
                administrative and communication workflows together in one
                place.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "One workspace for your school",
                  "Role-based access for your team",
                  "Organized academic management",
                  "Built for growing schools",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm text-indigo-100"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-white" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-indigo-200">
              Get your school workspace started in minutes.
            </p>
          </div>
        </section>

        {/* Signup panel */}
        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-2xl">
            <Link
              href="/"
              className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to SchoolPilot
            </Link>

            <div className="mb-7">
              <Link
                href="/"
                className="mb-6 hidden items-center gap-2.5 lg:inline-flex"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <span className="text-lg font-bold tracking-tight">
                  School<span className="text-primary">Pilot</span>
                </span>
              </Link>

              <h2 className="text-3xl font-bold tracking-tight">
                Create your school account
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Set up your school and administrator account to get started.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7"
            >
              <div className="space-y-7">
                {/* School information */}
                <section>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold">School information</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Tell us about the school you manage.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="schoolName"
                        className="mb-2 block text-sm font-semibold"
                      >
                        School name
                      </label>

                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />

                        <input
                          id="schoolName"
                          required
                          type="text"
                          value={form.schoolName}
                          onChange={(event) =>
                            updateField("schoolName", event.target.value)
                          }
                          placeholder="e.g. Bright Future Academy"
                          className="min-h-12 w-full rounded-xl border bg-background py-3 pl-11 pr-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label
                        htmlFor="schoolEmail"
                        className="mb-2 block text-sm font-semibold"
                      >
                        School email
                      </label>

                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />

                        <input
                          id="schoolEmail"
                          required
                          type="email"
                          autoComplete="organization"
                          value={form.schoolEmail}
                          onChange={(event) =>
                            updateField("schoolEmail", event.target.value)
                          }
                          placeholder="school@example.com"
                          className="min-h-12 w-full rounded-xl border bg-background py-3 pl-11 pr-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-border" />

                {/* Owner information */}
                <section>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold">Owner information</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Create the administrator account for your school.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="mb-2 block text-sm font-semibold"
                        >
                          First name
                        </label>

                        <input
                          id="firstName"
                          required
                          type="text"
                          autoComplete="given-name"
                          value={form.firstName}
                          onChange={(event) =>
                            updateField("firstName", event.target.value)
                          }
                          placeholder="First name"
                          className="min-h-12 w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="lastName"
                          className="mb-2 block text-sm font-semibold"
                        >
                          Last name
                        </label>

                        <input
                          id="lastName"
                          required
                          type="text"
                          autoComplete="family-name"
                          value={form.lastName}
                          onChange={(event) =>
                            updateField("lastName", event.target.value)
                          }
                          placeholder="Last name"
                          className="min-h-12 w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="ownerEmail"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Your email
                      </label>

                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />

                        <input
                          id="ownerEmail"
                          required
                          type="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={(event) =>
                            updateField("email", event.target.value)
                          }
                          placeholder="you@example.com"
                          className="min-h-12 w-full rounded-xl border bg-background py-3 pl-11 pr-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-semibold"
                      >
                        Password
                      </label>

                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />

                        <input
                          id="password"
                          required
                          type={showPassword ? "text" : "password"}
                          minLength={8}
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(event) =>
                            updateField("password", event.target.value)
                          }
                          placeholder="Minimum 8 characters"
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
                  </div>
                </section>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm leading-5 text-destructive"
                  >
                    {error}
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                  <p className="text-xs leading-5 text-muted-foreground">
                    Your account will be created with owner access to your
                    school workspace.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Create school account"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  Sign in
                </Link>
              </p>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By creating an account, you are setting up a SchoolPilot
              workspace for your school.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
