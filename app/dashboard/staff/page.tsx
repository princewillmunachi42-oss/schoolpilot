import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import StaffActions from "@/components/StaffActions";

export default async function StaffPage() {
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

  const staffResult = await pool.query(
    `SELECT
       id,
       staff_id,
       first_name,
       last_name,
       other_name,
       email,
       phone,
       role_title,
       status
     FROM staff
     WHERE school_id = $1
     ORDER BY first_name ASC, last_name ASC`,
    [membership.school_id]
  );

  const staff = staffResult.rows;

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
                Staff Management
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Staff
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Add and manage teachers and other members of your school staff.
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
              Staff overview
            </h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Total Staff",
                count: staff.length,
                tone: "bg-primary/10 text-primary",
              },
              {
                label: "Active",
                count: staff.filter((member) => member.status === "active").length,
                tone: "bg-success/10 text-success",
              },
              {
                label: "Inactive",
                count: staff.filter((member) => member.status === "inactive").length,
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
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="text-lg font-bold">+</span>
              </div>

              <div>
                <p className="text-sm font-semibold text-primary">
                  Staff Registration
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  Add Staff Member
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  Create a staff record and optionally provide teacher login credentials.
                </p>
              </div>
            </div>
          </div>

          <form
            action="/api/school/staff"
            method="POST"
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="staffId"
                className="mb-2 block text-sm font-medium"
              >
                Staff ID
              </label>

              <input
                id="staffId"
                name="staffId"
                type="text"
                required
                placeholder="e.g. STF001"
                className="w-full rounded-lg border bg-background px-3 py-2.5 uppercase outline-none focus:border-primary"
              />
            </div>

            <div>
              <label
                htmlFor="roleTitle"
                className="mb-2 block text-sm font-medium"
              >
                Role / Job Title
              </label>

              <input
                id="roleTitle"
                name="roleTitle"
                type="text"
                placeholder="e.g. Mathematics Teacher"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-sm font-medium"
              >
                First Name
              </label>

              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                placeholder="e.g. John"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="mb-2 block text-sm font-medium"
              >
                Last Name
              </label>

              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                placeholder="e.g. Doe"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="otherName"
                className="mb-2 block text-sm font-medium"
              >
                Other Name
              </label>

              <input
                id="otherName"
                name="otherName"
                type="text"
                placeholder="Optional"
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
                placeholder="staff@example.com"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
                        <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Teacher Login Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                placeholder="Minimum 8 characters"
                className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Optional. Required only when creating a teacher login account.
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
                  Add Staff Member
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="text-sm font-bold">S</span>
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-tight">
                  School Staff
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {staff.length}
                  </span>{" "}
                  {staff.length === 1 ? "staff member" : "staff members"}{" "}
                  in your school
                </p>
              </div>
            </div>
          </div>

          {staff.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No staff members yet</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your first staff member using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className="group flex flex-col gap-5 p-5 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between sm:p-6"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-1 ring-primary/10">
                      {member.first_name.charAt(0)}
                      {member.last_name.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {member.first_name} {member.other_name ?? ""}{" "}
                          {member.last_name}
                        </h3>

                        <span className="rounded-md bg-muted px-2 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
                          {member.staff_id}
                        </span>
                      </div>

                      <p className="mt-1.5 text-sm font-medium text-foreground/80">
                        {member.role_title || "No role title"}
                      </p>

                      <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-3">
                        {member.email && <span>{member.email}</span>}
                        {member.phone && <span>{member.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 sm:items-end">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        member.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {member.status}
                    </span>

                    <StaffActions id={member.id} />
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
