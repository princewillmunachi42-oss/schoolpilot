import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SchoolSettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const result = await pool.query(
    `SELECT
       sm.school_id,
       sm.role,
       s.name AS school_name,
       s.email AS school_email
     FROM school_members sm
     JOIN schools s ON s.id = sm.school_id
     WHERE sm.user_id = $1
     ORDER BY s.name
     LIMIT 1`,
    [user.id]
  );

  const membership = result.rows[0];

  if (!membership) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <header>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-primary">
                School Administration
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                School Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Manage your school's basic information and administrative
                details.
              </p>
            </div>
          </div>
        </header>

        {/* School overview */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              School
            </p>

            <p className="mt-1 truncate font-semibold">
              {membership.school_name}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Mail className="h-5 w-5" />
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contact Email
            </p>

            <p className="mt-1 truncate font-semibold">
              {membership.school_email}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Access Level
            </p>

            <p className="mt-1 font-semibold capitalize">
              {membership.role}
            </p>
          </div>
        </section>

        {/* Settings form */}
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  School Information
                </h2>

                <p className="text-sm text-muted-foreground">
                  Update the information displayed across your school
                  system.
                </p>
              </div>
            </div>
          </div>

          <form
            action="/api/school/settings"
            method="POST"
            className="space-y-6 p-5 sm:p-6"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="schoolName"
                  className="mb-2 block text-sm font-semibold"
                >
                  School Name
                </label>

                <input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  defaultValue={membership.school_name}
                  required
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Your school's official display name.
                </p>
              </div>

              <div>
                <label
                  htmlFor="schoolEmail"
                  className="mb-2 block text-sm font-semibold"
                >
                  School Email
                </label>

                <input
                  id="schoolEmail"
                  name="schoolEmail"
                  type="email"
                  defaultValue={membership.school_email}
                  required
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  The main contact email for your school.
                </p>
              </div>
            </div>

            {/* Account information */}
            <div className="rounded-2xl border bg-muted/30 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
                  <UserRound className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold">
                    Account Information
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Your current school membership details.
                  </p>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Account Owner
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {user.first_name} {user.last_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Role
                      </p>

                      <p className="mt-1 text-sm font-semibold capitalize">
                        {membership.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

              <div>
                <p className="text-sm font-semibold">
                  School-level settings
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Changes made here apply to your school's information.
                  Your account role and access permissions are managed
                  separately.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition-all hover:bg-muted"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
