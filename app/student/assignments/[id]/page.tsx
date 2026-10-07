import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentStudent } from "@/lib/auth/student";
import MarkAssignmentReadButton from "./MarkAssignmentReadButton";

export const dynamic = "force-dynamic";

export default async function StudentAssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentStudent = await getCurrentStudent();

  if (!currentStudent) {
    redirect("/login");
  }

  const { id } = await params;

  const result = await pool.query(
    `
      SELECT
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.status,
        a.created_at,
        a.updated_at,
        s.name AS subject_name,
        s.code AS subject_code,
        st.first_name AS teacher_first_name,
        st.last_name AS teacher_last_name,
        c.name AS class_name
      FROM assignments a
      INNER JOIN classes c
        ON c.id = a.class_id
       AND c.school_id = a.school_id
      INNER JOIN subjects s
        ON s.id = a.subject_id
       AND s.school_id = a.school_id
      INNER JOIN staff st
        ON st.id = a.staff_id
       AND st.school_id = a.school_id
      WHERE a.id = $1
        AND a.school_id = $2
        AND a.class_id = $3
        AND a.status = 'published'
      LIMIT 1
    `,
    [id, currentStudent.schoolId, currentStudent.student.class_id]
  );

  const assignment = result.rows[0];

  if (!assignment) {
    notFound();
  }

  const notificationResult = await pool.query(
    `
      SELECT id, is_read
      FROM notifications
      WHERE school_id = $1
        AND user_id = $2
        AND type = 'assignment'
        AND link = $3
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [
      currentStudent.schoolId,
      currentStudent.userId,
      `/student/assignments/${assignment.id}`,
    ]
  );

  const assignmentNotification =
    notificationResult.rows[0];

  const isRead = assignmentNotification?.is_read ?? true;
  const notificationId = assignmentNotification?.id ?? null;

  const teacherName = [
    assignment.teacher_first_name,
    assignment.teacher_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="space-y-6">
      <div>
        <Link
          href="/student/assignments"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to Assignments
        </Link>
      </div>

      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {assignment.subject_name}
              {assignment.subject_code
                ? ` • ${assignment.subject_code}`
                : ""}
            </p>

            <h1 className="mt-2 text-2xl font-bold">
              {assignment.title}
            </h1>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Class
              </p>
              <p className="font-medium">
                {assignment.class_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Teacher
              </p>
              <p className="font-medium">
                {teacherName || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Due Date
              </p>
              <p className="font-medium">
                {assignment.due_date
                  ? new Date(
                      assignment.due_date
                    ).toLocaleDateString()
                  : "No due date"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Status
              </p>
              <p className="font-medium capitalize">
                {assignment.status}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Instructions
            </p>

            <div className="mt-2 whitespace-pre-wrap rounded-xl border bg-muted/30 p-4 text-sm leading-6">
              {assignment.description ||
                "No instructions provided."}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4 text-sm">
            <p>
              Notification ID: {notificationId || "NONE"}
            </p>
            <p className="mt-1">
              Read status: {isRead ? "READ" : "UNREAD"}
            </p>
          </div>

          {notificationId && (
            <div className="space-y-3">
              <MarkAssignmentReadButton
                notificationId={notificationId}
              />

              {isRead && (
                <p className="text-sm text-muted-foreground">
                  This assignment notification is already marked as read.
                </p>
              )}
            </div>
          )}

          {!notificationId && (
            <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              No assignment notification is linked to this assignment.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
