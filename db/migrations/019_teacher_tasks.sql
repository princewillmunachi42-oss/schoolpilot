BEGIN;

CREATE TABLE IF NOT EXISTS teacher_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  assigned_staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date DATE,
  completion_note TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT teacher_tasks_title_not_empty
    CHECK (length(trim(title)) > 0),
  CONSTRAINT teacher_tasks_completion_consistency
    CHECK (
      (status = 'completed' AND completed_at IS NOT NULL)
      OR
      (status <> 'completed' AND completed_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS teacher_tasks_school_status_idx
  ON teacher_tasks (school_id, status, due_date);

CREATE INDEX IF NOT EXISTS teacher_tasks_assignee_idx
  ON teacher_tasks (school_id, assigned_staff_id, due_date);

CREATE TABLE IF NOT EXISTS teacher_task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES teacher_tasks(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id),
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL
    CHECK (new_status IN ('pending', 'in_progress', 'completed')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS teacher_task_history_task_idx
  ON teacher_task_history (school_id, task_id, created_at DESC);

COMMIT;
