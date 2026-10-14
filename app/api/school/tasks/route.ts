import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import pool from "@/lib/db";

const managerRoles = ["owner", "principal", "admin"];
const priorities = ["low", "normal", "high", "urgent"];

async function getManager() {
  const user = await getCurrentUser();
  if (!user) return null;

  const result = await pool.query(
    `SELECT school_id, role
     FROM school_members
     WHERE user_id = $1
       AND role = ANY($2::text[])
     LIMIT 1`,
    [user.id, managerRoles],
  );

  if (!result.rows[0]) return null;

  return {
    userId: user.id,
    schoolId: result.rows[0].school_id as string,
  };
}

function validDate(value: unknown) {
  if (value === null || value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export async function GET() {
  try {
    const manager = await getManager();
    if (!manager) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT
         t.id, t.title, t.description, t.priority, t.status,
         CASE
           WHEN t.status <> 'completed'
            AND t.due_date < CURRENT_DATE THEN 'overdue'
           ELSE t.status
         END AS display_status,
         t.due_date, t.completion_note, t.completed_at,
         t.created_at, t.updated_at,
         s.id AS staff_id, s.staff_id AS staff_number,
         s.first_name, s.last_name, s.role_title
       FROM teacher_tasks t
       JOIN staff s
         ON s.id = t.assigned_staff_id
        AND s.school_id = t.school_id
       WHERE t.school_id = $1
       ORDER BY
         CASE
           WHEN t.status <> 'completed'
            AND t.due_date < CURRENT_DATE THEN 0
           WHEN t.status = 'in_progress' THEN 1
           WHEN t.status = 'pending' THEN 2
           ELSE 3
         END,
         t.due_date ASC NULLS LAST,
         t.created_at DESC`,
      [manager.schoolId],
    );

    return NextResponse.json({ tasks: result.rows });
  } catch (error) {
    console.error("Management tasks GET error:", error);
    return NextResponse.json(
      { error: "Unable to load tasks." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const manager = await getManager();
  if (!manager) {
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

  const staffId = String(body.assigned_staff_id ?? "").trim();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const priority = String(body.priority ?? "normal");
  const dueDate =
    body.due_date == null || body.due_date === ""
      ? null
      : String(body.due_date);

  if (!staffId || !title || title.length > 200) {
    return NextResponse.json(
      { error: "Choose a teacher and provide a title of 1–200 characters." },
      { status: 400 },
    );
  }

  if (description.length > 10000) {
    return NextResponse.json(
      { error: "Description is too long." },
      { status: 400 },
    );
  }

  if (!priorities.includes(priority) || !validDate(dueDate)) {
    return NextResponse.json(
      { error: "Check the priority and deadline." },
      { status: 400 },
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const staffResult = await client.query(
      `SELECT id, user_id FROM staff
       WHERE id = $1
         AND school_id = $2
         AND status = 'active'
         AND user_id IS NOT NULL
         AND EXISTS (
           SELECT 1 FROM school_members sm
           WHERE sm.user_id = staff.user_id
             AND sm.school_id = staff.school_id
             AND sm.role = 'teacher'
         )
       FOR UPDATE`,
      [staffId, manager.schoolId],
    );

    if (!staffResult.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "The selected teacher must have an active staff record and a teacher-portal account in your school." },
        { status: 400 },
      );
    }

    const created = await client.query(
      `INSERT INTO teacher_tasks
         (school_id, assigned_staff_id, created_by, title,
          description, priority, due_date)
       VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, $7)
       RETURNING id, status`,
      [
        manager.schoolId,
        staffId,
        manager.userId,
        title,
        description,
        priority,
        dueDate,
      ],
    );

    const task = created.rows[0];

    await client.query(
      `INSERT INTO teacher_task_history
         (school_id, task_id, actor_user_id, old_status, new_status, note)
       VALUES ($1, $2, $3, NULL, $4, $5)`,
      [manager.schoolId, task.id, manager.userId, task.status, "Task created"],
    );

    await client.query(
      `INSERT INTO notifications
         (school_id, user_id, title, message, type, link)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        manager.schoolId,
        staffResult.rows[0].user_id,
        "New task assigned",
        "Assigned task: " + title + ". Priority: " + priority + ". Deadline: " + (dueDate ?? "Not set") + ".",
        "task",
        "/teacher/tasks",
      ],
    );

    await client.query("COMMIT");
    return NextResponse.json({ success: true, id: task.id }, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Management tasks POST error:", error);
    return NextResponse.json(
      { error: "Unable to create the task." },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
