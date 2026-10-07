import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import DeleteParentButton from "./DeleteParentButton";
import EditParentButton from "./EditParentButton";
export default async function ParentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const membershipResult = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
     LIMIT 1`,
    [user.id]
  );

  const membership = membershipResult.rows[0];

  if (!membership || membership.role !== "owner") {
    redirect("/dashboard");
  }

  const parentsResult = await pool.query(
    `SELECT
       id,
       full_name,
       email,
       phone,
       address,
       status
     FROM parents
     WHERE school_id = $1
     ORDER BY full_name ASC`,
    [membership.school_id]
  );

  const parents = parentsResult.rows;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              <span aria-hidden="true">←</span>
              Back to Dashboard
            </Link>

            <div className="mt-5">
              <p className="text-sm font-semibold text-primary">
                Parent Management
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Parents
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Register and manage parents and guardians in your school.
              </p>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <div>
            <p className="text-sm font-semibold text-primary">
              At a glance
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">
              Parent overview
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Total Parents",
                count: parents.length,
                tone: "bg-primary/10 text-primary",
              },
              {
                label: "Active",
                count: parents.filter((parent) => parent.status === "active").length,
                tone: "bg-success/10 text-success",
              },
              {
                label: "Inactive",
                count: parents.filter((parent) => parent.status === "inactive").length,
                tone: "bg-muted text-muted-foreground",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="group rounded-2xl border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight">
                      {card.count}
                    </p>
                  </div>

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.tone}`}
                  >
                    <span className="text-sm font-bold">#</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="text-lg font-bold">+</span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    Parent Registration
                  </p>
                  <h2 className="mt-1 text-xl font-bold tracking-tight">
                    Add Parent
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Create a parent or guardian record and login account.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/parent-students"
                className="hidden shrink-0 items-center rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/10 sm:inline-flex"
              >
                Manage Relationships →
              </Link>
            </div>

            <Link
              href="/dashboard/parent-students"
              className="mt-4 inline-flex items-center rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-sm font-semibold text-primary transition-all hover:border-primary/30 hover:bg-primary/10 sm:hidden"
            >
              Manage Parent-Student Relationships →
            </Link>
          </div>

          <form
            action="/api/school/parents"
            method="POST"
            className="grid gap-5 p-5 sm:p-6 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium"
              >
                Full Name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="e.g. John Doe"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
  <label
    htmlFor="email"
    className="mb-2 block text-sm font-medium"
  >
    Email
  </label>

  <input
    id="email"
    name="email"
    type="email"
    required
    placeholder="parent@example.com"
    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
  />
</div>
<div>
  <label
    htmlFor="password"
    className="mb-2 block text-sm font-medium"
  >
    Login Password
  </label>

  <input
    id="password"
    name="password"
    type="password"
    required
    minLength={8}
    autoComplete="new-password"
    className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
    placeholder="Minimum 8 characters"
  />

  <p className="mt-1 text-xs text-muted-foreground">
    This password will be used by the parent to sign in.
  </p>
</div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium"
              >
                Phone
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. 08012345678"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-medium"
              >
                Address
              </label>

              <textarea
                id="address"
                name="address"
                rows={3}
                placeholder="Parent or guardian address"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue="active"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="border-t pt-5 md:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <p className="text-xs text-muted-foreground sm:mr-auto">
                  Required fields are marked by the browser.
                </p>

                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-md sm:w-auto"
                >
                  Add Parent
                </button>
              </div>
            </div>

            </form>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="text-sm font-bold">P</span>
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight">
                  School Parents
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {parents.length}
                  </span>{" "}
                  {parents.length === 1 ? "parent" : "parents"} registered in
                  your school
                </p>
              </div>
            </div>
          </div>

          {parents.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No parents yet</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your first parent using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {parents.map((parent) => (
                <div
                  key={parent.id}
                  className="group flex flex-col gap-5 p-5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/10">
                      {parent.full_name
                        .split(" ")
                        .slice(0, 2)
                        .map((part: string) => part.charAt(0))
                        .join("")}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        {parent.full_name}
                      </h3>

                      <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                        {parent.email && <span>{parent.email}</span>}
                        {parent.phone && <span>{parent.phone}</span>}
                        {parent.address && (
                          <span className="max-w-2xl leading-5">
                            {parent.address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        parent.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {parent.status}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      <EditParentButton parent={parent} />

                      <DeleteParentButton
                        parentId={parent.id}
                        parentName={parent.full_name}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
