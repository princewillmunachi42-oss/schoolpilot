import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StudentsPage() {
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

  const classesResult = await pool.query(
    `SELECT id, name
     FROM classes
     WHERE school_id = $1
       AND status = 'active'
     ORDER BY name ASC`,
    [membership.school_id]
  );

  const classes = classesResult.rows;

  const studentsResult = await pool.query(
    `SELECT
       st.id,
       st.admission_number,
       st.first_name,
       st.last_name,
       st.other_name,
       st.gender,
       st.date_of_birth,
       st.email,
       st.phone,
       st.status,
       c.name AS class_name
     FROM students st
     LEFT JOIN classes c
       ON c.id = st.class_id
      AND c.school_id = st.school_id
     WHERE st.school_id = $1
     ORDER BY st.first_name ASC, st.last_name ASC`,
    [membership.school_id]
  );

  const students = studentsResult.rows;

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
            Students
          </h1>

          <p className="mt-2 text-muted-foreground">
            Register and manage students in your school.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Add Student</h2>

          {classes.length === 0 ? (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
              <p className="font-medium">No active classes found.</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Create an active class before adding students.
              </p>

              <Link
                href="/dashboard/classes"
                className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
              >
                Create Class
              </Link>
            </div>
          ) : (
            <form
              action="/api/school/students"
              method="POST"
              className="mt-6 grid gap-5 md:grid-cols-2"
            >
              <div>
                <label
                  htmlFor="admissionNumber"
                  className="mb-2 block text-sm font-medium"
                >
                  Admission Number
                </label>
                <input
                  id="admissionNumber"
                  name="admissionNumber"
                  type="text"
                  required
                  placeholder="e.g. STU001"
                  className="w-full rounded-lg border bg-background px-3 py-2.5 uppercase outline-none focus:border-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="classId"
                  className="mb-2 block text-sm font-medium"
                >
                  Class
                </label>
                <select
                  id="classId"
                  name="classId"
                  required
                  defaultValue={classes[0].id}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
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
                  placeholder="e.g. Jane"
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
                  htmlFor="gender"
                  className="mb-2 block text-sm font-medium"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  defaultValue=""
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option value="">Not specified</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="mb-2 block text-sm font-medium"
                >
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
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
                  placeholder="student@example.com"
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
                  placeholder="Optional"
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
                  <option value="graduated">Graduated</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Add Student
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">School Students</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {students.length}{" "}
              {students.length === 1 ? "student" : "students"} registered
            </p>
          </div>

          {students.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">No students yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first student using the form above.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">
                      {student.first_name}{" "}
                      {student.other_name ? `${student.other_name} ` : ""}
                      {student.last_name}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Admission No: {student.admission_number}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Class: {student.class_name ?? "Not assigned"}
                      {student.gender ? ` • ${student.gender}` : ""}
                    </p>

                    {student.email && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {student.email}
                      </p>
                    )}

                    {student.phone && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {student.phone}
                      </p>
                    )}
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      student.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {student.status}
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
