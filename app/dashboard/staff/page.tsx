import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

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
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Staff
          </h1>

          <p className="mt-2 text-muted-foreground">
            Add and manage members of your school staff.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Add Staff Member</h2>

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
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
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
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
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
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
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
                placeholder="staff@example.com"
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
              />
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

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Add Staff Member
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">School Staff</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {staff.length}{" "}
              {staff.length === 1 ? "staff member" : "staff members"}{" "}
              added
            </p>
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
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">
                      {member.first_name} {member.other_name ?? ""}{" "}
                      {member.last_name}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Staff ID: {member.staff_id}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {member.role_title || "No role title"}
                      {member.email ? ` • ${member.email}` : ""}
                    </p>

                    {member.phone && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {member.phone}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      member.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
