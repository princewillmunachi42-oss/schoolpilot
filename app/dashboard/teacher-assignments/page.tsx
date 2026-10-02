import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import TeacherAssignmentActions from "@/components/TeacherAssignmentActions";
export default async function TeacherAssignmentsPage() {
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

  const [
    staffResult,
    classesResult,
    subjectsResult,
    classTeachersResult,
    teacherSubjectsResult,
  ] = await Promise.all([
    pool.query(
      `SELECT
         id,
         staff_id,
         first_name,
         last_name,
         role_title
       FROM staff
       WHERE school_id = $1
         AND status = 'active'
       ORDER BY first_name ASC, last_name ASC`,
      [membership.school_id]
    ),

    pool.query(
      `SELECT
         id,
         name
       FROM classes
       WHERE school_id = $1
         AND status = 'active'
       ORDER BY name ASC`,
      [membership.school_id]
    ),

    pool.query(
      `SELECT
         id,
         name,
         code
       FROM subjects
       WHERE school_id = $1
       ORDER BY name ASC`,
      [membership.school_id]
    ),

    pool.query(
      `SELECT
         ct.id,
         st.first_name,
         st.last_name,
         st.staff_id,
         c.name AS class_name,
         ct.is_primary
       FROM class_teachers ct
       JOIN staff st ON st.id = ct.staff_id
       JOIN classes c ON c.id = ct.class_id
       WHERE ct.school_id = $1
       ORDER BY c.name ASC, st.first_name ASC`,
      [membership.school_id]
    ),

    pool.query(
      `SELECT
         ts.id,
         st.first_name,
         st.last_name,
         st.staff_id,
         sub.name AS subject_name,
         sub.code AS subject_code,
         c.name AS class_name
       FROM teacher_subjects ts
       JOIN staff st ON st.id = ts.staff_id
       JOIN subjects sub ON sub.id = ts.subject_id
       LEFT JOIN classes c ON c.id = ts.class_id
       WHERE ts.school_id = $1
       ORDER BY st.first_name ASC, sub.name ASC`,
      [membership.school_id]
    ),
  ]);

  const staff = staffResult.rows;
  const classes = classesResult.rows;
  const subjects = subjectsResult.rows;
  const classTeachers = classTeachersResult.rows;
  const teacherSubjects = teacherSubjectsResult.rows;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            ← Back to Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Teacher Assignments
          </h1>

          <p className="mt-2 text-muted-foreground">
            Assign teachers to classes and subjects in your school.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Assign Teacher to Class
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Set a teacher as the primary teacher for a class when
              needed.
            </p>

            <form
              action="/api/school/teacher-assignments"
              method="POST"
              className="mt-6 space-y-5"
            >
              <input
                type="hidden"
                name="assignmentType"
                value="class"
              />

              <div>
                <label
                  htmlFor="classStaffId"
                  className="mb-2 block text-sm font-medium"
                >
                  Teacher
                </label>

                <select
                  id="classStaffId"
                  name="staffId"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select teacher
                  </option>

                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} —{" "}
                      {member.staff_id}
                      {member.role_title
                        ? ` (${member.role_title})`
                        : ""}
                    </option>
                  ))}
                </select>
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
                  defaultValue=""
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select class
                  </option>

                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isPrimary"
                  className="h-4 w-4 rounded border"
                />

                <span className="text-sm font-medium">
                  Make this the primary teacher for this class
                </span>
              </label>

              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Assign to Class
              </button>
            </form>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Assign Teacher to Subject
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Assign a subject generally or specifically to a class.
            </p>

            <form
              action="/api/school/teacher-assignments"
              method="POST"
              className="mt-6 space-y-5"
            >
              <input
                type="hidden"
                name="assignmentType"
                value="subject"
              />

              <div>
                <label
                  htmlFor="subjectStaffId"
                  className="mb-2 block text-sm font-medium"
                >
                  Teacher
                </label>

                <select
                  id="subjectStaffId"
                  name="staffId"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select teacher
                  </option>

                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name} —{" "}
                      {member.staff_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="subjectId"
                  className="mb-2 block text-sm font-medium"
                >
                  Subject
                </label>

                <select
                  id="subjectId"
                  name="subjectId"
                  required
                  defaultValue=""
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select subject
                  </option>

                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} — {subject.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="subjectClassId"
                  className="mb-2 block text-sm font-medium"
                >
                  Specific Class
                </label>

                <select
                  id="subjectClassId"
                  name="classId"
                  defaultValue=""
                  className="w-full rounded-lg border bg-background px-3 py-2.5 outline-none focus:border-primary"
                >
                  <option value="">
                    All classes / general assignment
                  </option>

                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Assign Subject
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">
              Class Teacher Assignments
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {classTeachers.length}{" "}
              {classTeachers.length === 1
                ? "assignment"
                : "assignments"}
            </p>
          </div>

          {classTeachers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">
                No class teacher assignments yet
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {classTeachers.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold">
                      {assignment.first_name}{" "}
                      {assignment.last_name}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Staff ID: {assignment.staff_id}
                    </p>
                   <div className="mt-4 border-t pt-4">
  <TeacherAssignmentActions
    id={assignment.id}
    assignmentType="class"
  />
</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Class: {assignment.class_name}
                    </p>
                  </div>

                  {assignment.is_primary && (
                    <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Primary Teacher
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border bg-card shadow-sm">
          <div className="border-b p-6">
            <h2 className="text-xl font-semibold">
              Teacher Subject Assignments
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {teacherSubjects.length}{" "}
              {teacherSubjects.length === 1
                ? "assignment"
                : "assignments"}
            </p>
          </div>

          {teacherSubjects.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium">
                No subject assignments yet
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {teacherSubjects.map((assignment) => (
                <div key={assignment.id} className="p-6">
                  <h3 className="font-semibold">
                    {assignment.first_name}{" "}
                    {assignment.last_name}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Staff ID: {assignment.staff_id}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Subject: {assignment.subject_name} (
                    {assignment.subject_code})
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Class:{" "}
                    {assignment.class_name || "General assignment"}
                  </p>
                 <div className="mt-4 border-t pt-4">
  <TeacherAssignmentActions
    id={assignment.id}
    assignmentType="subject"
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

