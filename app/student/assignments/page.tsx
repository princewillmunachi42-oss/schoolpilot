import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudent } from "@/lib/auth/student";
import pool from "@/lib/db";
import MarkAssignmentReadButton from "./[id]/MarkAssignmentReadButton";

export default async function StudentAssignmentsPage() {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const { student, schoolId } = currentStudent;

  if (!student.class_id) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/student"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            ← Back to Student Dashboard
          </Link>
        </div>

        <div className="rounded-2xl border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold">
            Assignments unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            You have not been assigned to a class yet.
          </p>
        </div>
      </section>
    );
  }

  const [classResult, assignmentsResult] =
    await Promise.all([
      pool.query(
        `
          SELECT
            id,
            name,
            level
          FROM classes
          WHERE id = $1
            AND school_id = $2
            AND status = 'active'
          LIMIT 1
        `,
        [student.class_id, schoolId]
      ),

pool.query(
  `
    SELECT
      a.id,
      a.title,
      a.description,
      a.due_date,
      a.created_at,
      s.name AS subject_name,
      s.code AS subject_code,
      CONCAT(st.first_name, ' ', st.last_name) AS teacher_name,
      n.id AS notification_id,
      n.is_read AS notification_is_read
    FROM assignments a
    INNER JOIN subjects s
      ON s.id = a.subject_id
     AND s.school_id = a.school_id
    INNER JOIN staff st
      ON st.id = a.staff_id
     AND st.school_id = a.school_id
    LEFT JOIN notifications n
      ON n.link = '/student/assignments/' || a.id
     AND n.school_id = a.school_id
     AND n.user_id = $3
     AND n.type = 'assignment'
    WHERE a.school_id = $1
      AND a.class_id = $2
      AND a.status = 'published'
    ORDER BY
      CASE
        WHEN a.due_date IS NULL THEN 1
        ELSE 0
      END,
      a.due_date ASC,
      a.created_at DESC
  `,
  [schoolId, student.class_id, currentStudent.userId]
),
    ]);

  const studentClass = classResult.rows[0];
  const assignments = assignmentsResult.rows;

  return (
    <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <Link
          href="/student"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to Student Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-primary">
          Student Portal
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Assignments
        </h1>

        <p className="mt-2 text-muted-foreground">
          {studentClass
            ? `${studentClass.name}${
                studentClass.level
                  ? ` • ${studentClass.level}`
                  : ""
              }`
            : "Your class assignments"}
        </p>
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold">
            No assignments
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no published assignments for your class.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const dueDate = assignment.due_date
              ? new Intl.DateTimeFormat("en-NG", {
                  dateStyle: "medium",
                }).format(new Date(assignment.due_date))
              : null;

            return (
              <article
                key={assignment.id}
                className="rounded-2xl border bg-card p-5 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
                        {assignment.subject_name}
                      </span>

                      {assignment.subject_code && (
                        <span className="text-xs text-muted-foreground">
                          {assignment.subject_code}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-semibold">
                      {assignment.title}
                    </h2>

                    {assignment.description && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {assignment.description}
                      </p>
                    )}
                  </div>

                  {dueDate && (
                    <div className="shrink-0 rounded-xl border px-3 py-2 sm:text-right">
                      <p className="text-xs text-muted-foreground">
                        Due date
                      </p>

                      <p className="mt-1 text-sm font-medium">
                        {dueDate}
                      </p>
                    </div>
                  )}
                </div>

<div className="mt-5 border-t pt-4">
  <p className="text-xs text-muted-foreground">
    Teacher
  </p>

  <p className="mt-1 text-sm font-medium">
    {assignment.teacher_name}
  </p>

  {assignment.notification_id &&
    !assignment.notification_is_read && (
      <div className="mt-4">
        <MarkAssignmentReadButton
          notificationId={assignment.notification_id}
        />
      </div>
    )}
</div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
