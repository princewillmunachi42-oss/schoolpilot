import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeacher } from "@/lib/auth/teacher";
import pool from "@/lib/db";

const statuses = ["pending", "in_progress", "completed"];

export async function GET() {
  try {
    const teacher = await getCurrentTeacher();
    if (!teacher) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
         id, title, description, priority, status,
         CASE
           WHEN status <> 'completed'
            AND due_date < CURRENT_DATE THEN 'overdue'
           ELSE status
         END AS display_status,
         due_date, completion_note, completed_at, created_at, updated_at
       FROM teacher_tasks
       WHERE school_id = $1 AND assigned_staff_id = $2
       ORDER BY
         CASE
           WHEN status <> 'completed'
            AND due_date < CURRENT_DATE THEN 0
           WHEN status = 'in_progress' THEN 1
           WHEN status = 'pending' THEN 2
           ELSE 3
         END,
         due_date ASC NULLS LAST,
         created_at DESC`,
      [teacher.schoolId, teacher.staffId],
    );

    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.log("Teacher tasks GET error:", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { error: "Unable to load your tasks." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  let teacher;
  try {
    teacher = await getCurrentTeacher();
  } catch (error) {
    console.log("Teacher task session lookup error:", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { error: "Unable to verify your teacher session. Please sign in again." },
      { status: 500 },
    );
  }

  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const taskId = String(body.id ?? "").trim();
  const status = String(body.status ?? "");
  const note =
    body.completion_note == null ? "" : String(body.completion_note).trim();

  if (!taskId || !statuses.includes(status) || note.length > 5000) {
    return NextResponse.json(
      { error: "Check the task update details." },
      { status: 400 },
    );
  }

  let client: import("pg").PoolClient | null = null;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const found = await client.query(
      `SELECT t.id, t.status, t.title, t.created_by,
              s.first_name, s.last_name
       FROM teacher_tasks t
       JOIN staff s
         ON s.id = t.assigned_staff_id
        AND s.school_id = t.school_id
       WHERE t.id = $1 AND t.school_id = $2
         AND t.assigned_staff_id = $3
       FOR UPDATE OF t`,
      [taskId, teacher.schoolId, teacher.staffId],
    );

    const task = found.rows[0];
    if (!task) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const updated = await client.query(
      `UPDATE teacher_tasks
       SET status = $4,
           completion_note = NULLIF($5, ''),
           completed_at = CASE
             WHEN $6 = 'completed'
               THEN COALESCE(completed_at, NOW())
             ELSE NULL
           END,
           updated_at = NOW()
       WHERE id = $1 AND school_id = $2 AND assigned_staff_id = $3
       RETURNING id, status, completion_note, completed_at, updated_at`,
      [taskId, teacher.schoolId, teacher.staffId, status, note, status],
    );

    await client.query(
      `INSERT INTO teacher_task_history
         (school_id, task_id, actor_user_id, old_status, new_status, note)
       VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''))`,
      [
        teacher.schoolId,
        taskId,
        teacher.userId,
        task.status,
        status,
        note || null,
      ],
    );

    if (status === "completed" && task.status !== "completed") {
      const teacherName =
        [task.first_name, task.last_name].filter(Boolean).join(" ") ||
        "The assigned teacher";

      await client.query(
        `INSERT INTO notifications
           (school_id, user_id, title, message, type, link)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          teacher.schoolId,
          task.created_by,
          "Task completed",
          `"${task.title}" was marked completed by ${teacherName}.`,
          "task",
          "/dashboard/tasks",
        ],
      );
    }

    await client.query("COMMIT");
    return NextResponse.json({ success: true, task: updated.rows[0] });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }
    console.log("Teacher tasks PATCH error:", error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : "");
    return NextResponse.json(
      { error: "Unable to update this task." },
      { status: 500 },
    );
  } finally {
    client?.release();
  }
}
