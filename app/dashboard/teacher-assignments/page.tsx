import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BookMarked,
  CheckCircle2,
  GraduationCap,
  Plus,
  School,
  UserRound,
  Users,
} from "lucide-react";
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
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <Users className="h-4 w-4" />
                Operations
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Teacher Assignments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Assign teachers to classes and subjects, then manage
                the assignments from one place.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm shadow-sm">
              <School className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {staff.length} active teachers
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Staff
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold">
              {staff.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Active teachers
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Classes
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold">
              {classes.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Active classes
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-success/10 p-2.5 text-success">
                <BookMarked className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Subjects
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold">
              {subjects.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Available subjects
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-warning/10 p-2.5 text-warning">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Assignments
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold">
              {classTeachers.length + teacherSubjects.length}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Active teacher mappings
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Assign Teacher to Class
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Assign a teacher to a class and optionally make
                    them the primary class teacher.
                  </p>
                </div>
              </div>
            </div>

            <form
              action="/api/school/teacher-assignments"
              method="POST"
              className="space-y-5 p-5 sm:p-6"
            >
              <input
                type="hidden"
                name="assignmentType"
                value="class"
              />

              <div>
                <label
                  htmlFor="classStaffId"
                  className="mb-2 block text-sm font-semibold"
                >
                  Teacher
                </label>

                <select
                  id="classStaffId"
                  name="staffId"
                  required
                  defaultValue=""
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="mb-2 block text-sm font-semibold"
                >
                  Class
                </label>

                <select
                  id="classId"
                  name="classId"
                  required
                  defaultValue=""
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  name="isPrimary"
                  className="mt-0.5 h-4 w-4 rounded border"
                />

                <span>
                  <span className="block text-sm font-semibold">
                    Primary class teacher
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                    Mark this teacher as the primary teacher for
                    the selected class.
                  </span>
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                Assign to Class
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/30 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                  <BookMarked className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-semibold">
                    Assign Teacher to Subject
                  </h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Assign a subject generally or limit it to a
                    specific class.
                  </p>
                </div>
              </div>
            </div>

            <form
              action="/api/school/teacher-assignments"
              method="POST"
              className="space-y-5 p-5 sm:p-6"
            >
              <input
                type="hidden"
                name="assignmentType"
                value="subject"
              />

              <div>
                <label
                  htmlFor="subjectStaffId"
                  className="mb-2 block text-sm font-semibold"
                >
                  Teacher
                </label>

                <select
                  id="subjectStaffId"
                  name="staffId"
                  required
                  defaultValue=""
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="mb-2 block text-sm font-semibold"
                >
                  Subject
                </label>

                <select
                  id="subjectId"
                  name="subjectId"
                  required
                  defaultValue=""
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="" disabled>
                    Select subject
                  </option>

                  {subjects.map((subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name} — {subject.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="subjectClassId"
                  className="mb-2 block text-sm font-semibold"
                >
                  Specific Class
                </label>

                <select
                  id="subjectClassId"
                  name="classId"
                  defaultValue=""
                  className="min-h-11 w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                Assign Subject
              </button>
            </form>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Users className="h-4 w-4" />
                  </div>

                  <h2 className="text-lg font-semibold">
                    Class Teacher Assignments
                  </h2>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {classTeachers.length}{" "}
                  {classTeachers.length === 1
                    ? "assignment"
                    : "assignments"}{" "}
                  currently configured.
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {classTeachers.length} active
              </span>
            </div>
          </div>

          {classTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                <GraduationCap className="h-8 w-8" />
              </div>

              <h3 className="mt-4 font-semibold">
                No class teacher assignments yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Use the assignment form above to connect teachers
                with your active classes.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {classTeachers.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">
                        {assignment.first_name
                          .charAt(0)
                          .toUpperCase()}
                        {assignment.last_name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {assignment.first_name}{" "}
                            {assignment.last_name}
                          </h3>

                          {assignment.is_primary && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              <CheckCircle2 className="h-3 w-3" />
                              Primary
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Staff ID: {assignment.staff_id}
                        </p>

                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          {assignment.class_name}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 lg:border-0 lg:pt-0">
                      <TeacherAssignmentActions
                        id={assignment.id}
                        assignmentType="class"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-accent/10 p-2 text-accent">
                    <BookMarked className="h-4 w-4" />
                  </div>

                  <h2 className="text-lg font-semibold">
                    Teacher Subject Assignments
                  </h2>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {teacherSubjects.length}{" "}
                  {teacherSubjects.length === 1
                    ? "assignment"
                    : "assignments"}{" "}
                  currently configured.
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                <BookMarked className="h-3.5 w-3.5" />
                {teacherSubjects.length} active
              </span>
            </div>
          </div>

          {teacherSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="rounded-2xl bg-accent/10 p-4 text-accent">
                <BookMarked className="h-8 w-8" />
              </div>

              <h3 className="mt-4 font-semibold">
                No subject assignments yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Use the subject assignment form above to assign
                teachers to subjects.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {teacherSubjects.map((assignment) => (
                <div
                  key={assignment.id}
                  className="p-5 transition-colors hover:bg-muted/20 sm:p-6"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 font-semibold text-accent">
                        {assignment.first_name
                          .charAt(0)
                          .toUpperCase()}
                        {assignment.last_name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold">
                          {assignment.first_name}{" "}
                          {assignment.last_name}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                          Staff ID: {assignment.staff_id}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
                            <BookMarked className="h-4 w-4" />
                            {assignment.subject_name} (
                            {assignment.subject_code})
                          </span>

                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            {assignment.class_name ||
                              "General assignment"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 lg:border-0 lg:pt-0">
                      <TeacherAssignmentActions
                        id={assignment.id}
                        assignmentType="subject"
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
