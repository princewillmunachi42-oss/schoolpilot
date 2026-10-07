import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  UserRound,
} from "lucide-react";
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
      <main className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <BackLink />

          <EmptyState
            title="Assignments unavailable"
            description="You have not been assigned to a class yet."
          />
        </div>
      </main>
    );
  }

  const [classResult, assignmentsResult] = await Promise.all([
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

  const classLabel = studentClass
    ? `${studentClass.name}${
        studentClass.level ? ` • ${studentClass.level}` : ""
      }`
    : "Your class assignments";

  const withDueDates = assignments.filter(
    (assignment) => assignment.due_date
  ).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <BackLink />

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <ClipboardList className="h-3.5 w-3.5" />
            Student Portal
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Assignments
              </h1>

              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                Keep track of published classwork and important deadlines.
              </p>
            </div>

            <div className="flex w-fit items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Current Class
                </p>
                <p className="text-sm font-bold">{classLabel}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Summary */}
        {assignments.length > 0 && (
          <section className="mb-6 grid gap-4 sm:grid-cols-2">
            <SummaryCard
              icon={ClipboardList}
              label="Published Assignments"
              value={String(assignments.length)}
              description="Available to your class"
            />

            <SummaryCard
              icon={CalendarDays}
              label="With Due Dates"
              value={String(withDueDates)}
              description="Assignments with deadlines"
            />
          </section>
        )}

        {assignments.length === 0 ? (
          <EmptyState
            title="No assignments yet"
            description="There are currently no published assignments for your class."
          />
        ) : (
          <section className="space-y-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Your Assignments</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Published work from your teachers.
                </p>
              </div>
            </div>

            {assignments.map((assignment) => {
              const dueDate = assignment.due_date
                ? new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                  }).format(new Date(assignment.due_date))
                : null;

              return (
                <article
                  key={assignment.id}
                  className="group rounded-3xl border bg-card p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
                >
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            <BookOpen className="h-3 w-3" />
                            {assignment.subject_name}
                          </span>

                          {assignment.subject_code && (
                            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                              {assignment.subject_code}
                            </span>
                          )}
                        </div>

                        <h2 className="mt-4 text-xl font-bold tracking-tight">
                          {assignment.title}
                        </h2>

                        {assignment.description && (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {assignment.description}
                          </p>
                        )}
                      </div>

                      {dueDate ? (
                        <div className="flex shrink-0 items-center gap-3 rounded-2xl border bg-background px-4 py-3 sm:min-w-[145px] sm:flex-col sm:items-start sm:gap-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Due date
                          </div>

                          <p className="text-sm font-bold">
                            {dueDate}
                          </p>
                        </div>
                      ) : (
                        <span className="w-fit shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                          No deadline
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                          <UserRound className="h-4 w-4 text-muted-foreground" />
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Teacher
                          </p>
                          <p className="mt-0.5 text-sm font-semibold">
                            {assignment.teacher_name}
                          </p>
                        </div>
                      </div>

                      {assignment.notification_id &&
                        !assignment.notification_is_read && (
                          <MarkAssignmentReadButton
                            notificationId={assignment.notification_id}
                          />
                        )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/student"
      className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Student Dashboard
    </Link>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-3xl border bg-card p-10 text-center shadow-sm sm:p-14">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <ClipboardList className="h-7 w-7 text-muted-foreground" />
      </div>

      <h2 className="mt-5 text-xl font-bold">{title}</h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>

      <Link
        href="/student"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </section>
  );
}
