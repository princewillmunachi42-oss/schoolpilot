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
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Parents
          </h1>

          <p className="mt-2 text-muted-foreground">
            Register and manage parents and guardians in your school.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
<div className="mb-4">
  <Link
    href="/dashboard/parent-students"
    className="inline-flex items-center rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
  >
    Manage Parent-Student Relationships →
  </Link>
</div>          
<h2 className="text-xl font-semibold">Add Parent</h2>

          <form
            action="/api/school/parents"
            method="POST"
            className="mt-6 grid gap-5 md:grid-cols-2"
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
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
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
    className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none"
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
    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
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
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
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
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Add Parent
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">School Parents</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {parents.length}{" "}
              {parents.length === 1 ? "parent" : "parents"} registered
            </p>
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
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">{parent.full_name}</h3>

                    {parent.email && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {parent.email}
                      </p>
                    )}

                    {parent.phone && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {parent.phone}
                      </p>
                    )}

                    {parent.address && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {parent.address}
                      </p>
                    )}
                  </div>

                                                     <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        parent.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {parent.status}
                    </span>

                    <EditParentButton parent={parent} />

                    <DeleteParentButton
                      parentId={parent.id}
                      parentName={parent.full_name}
                    />
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
