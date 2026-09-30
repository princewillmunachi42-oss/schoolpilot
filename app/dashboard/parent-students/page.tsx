import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ParentStudentsPage() {
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

  const [parentsResult, studentsResult, linksResult] =
    await Promise.all([
      pool.query(
        `SELECT id, full_name
         FROM parents
         WHERE school_id = $1
           AND status = 'active'
         ORDER BY full_name ASC`,
        [membership.school_id]
      ),

      pool.query(
        `SELECT
           s.id,
           s.admission_number,
           s.first_name,
           s.last_name,
           c.name AS class_name
         FROM students s
         LEFT JOIN classes c ON c.id = s.class_id
         WHERE s.school_id = $1
           AND s.status = 'active'
         ORDER BY s.first_name ASC, s.last_name ASC`,
        [membership.school_id]
      ),

      pool.query(
        `SELECT
           ps.id,
           p.full_name AS parent_name,
           s.first_name,
           s.last_name,
           s.admission_number,
           c.name AS class_name,
           ps.relationship,
           ps.is_primary_contact
         FROM parent_students ps
         JOIN parents p ON p.id = ps.parent_id
         JOIN students s ON s.id = ps.student_id
         LEFT JOIN classes c ON c.id = s.class_id
         WHERE ps.school_id = $1
         ORDER BY p.full_name ASC, s.first_name ASC`,
        [membership.school_id]
      ),
    ]);

  const parents = parentsResult.rows;
  const students = studentsResult.rows;
  const links = linksResult.rows;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard/parents"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            ← Back to Parents
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Parent-Student Relationships
          </h1>

          <p className="mt-2 text-muted-foreground">
            Link parents and guardians to the students they are
            responsible for.
          </p>
        </div>

        <section className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">
            Link Parent to Student
          </h2>

          <form
            action="/api/school/parent-students"
            method="POST"
            className="mt-6 grid gap-5 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="parentId"
                className="mb-2 block text-sm font-medium"
              >
                Parent
              </label>

              <select
                id="parentId"
                name="parentId"
                required
                defaultValue=""
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select parent
                </option>

                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="studentId"
                className="mb-2 block text-sm font-medium"
              >
                Student
              </label>

              <select
                id="studentId"
                name="studentId"
                required
                defaultValue=""
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
              >
                <option value="" disabled>
                  Select student
                </option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} —{" "}
                    {student.admission_number}
                    {student.class_name
                      ? ` (${student.class_name})`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="relationship"
                className="mb-2 block text-sm font-medium"
              >
                Relationship
              </label>

              <select
                id="relationship"
                name="relationship"
                defaultValue=""
                className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
              >
                <option value="">Select relationship</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Uncle">Uncle</option>
                <option value="Aunt">Aunt</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-7">
              <input
                id="isPrimaryContact"
                name="isPrimaryContact"
                type="checkbox"
                className="h-4 w-4 rounded border"
              />

              <label
                htmlFor="isPrimaryContact"
                className="text-sm font-medium"
              >
                Primary contact for this student
              </label>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Link Parent to Student
              </button>
            </div>
          </form>

          {parents.length === 0 && (
            <p className="mt-4 text-sm text-warning">
              Add a parent first before creating a relationship.
            </p>
          )}

          {students.length === 0 && (
            <p className="mt-2 text-sm text-warning">
              Add a student first before creating a relationship.
            </p>
          )}
        </section>

        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">
              Existing Relationships
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {links.length}{" "}
              {links.length === 1 ? "relationship" : "relationships"}{" "}
              registered
            </p>
          </div>

          {links.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">
                No parent-student relationships yet
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Use the form above to link a parent to a student.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">
                      {link.parent_name}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Student: {link.first_name} {link.last_name}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Admission: {link.admission_number}
                      {link.class_name
                        ? ` • ${link.class_name}`
                        : ""}
                    </p>

                    {link.relationship && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Relationship: {link.relationship}
                      </p>
                    )}
                  </div>

                  {link.is_primary_contact && (
                    <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Primary Contact
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
