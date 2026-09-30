CREATE TABLE IF NOT EXISTS class_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (class_id, staff_id)
);

CREATE INDEX IF NOT EXISTS class_teachers_school_id_idx
ON class_teachers (school_id);

CREATE INDEX IF NOT EXISTS class_teachers_class_id_idx
ON class_teachers (class_id);

CREATE INDEX IF NOT EXISTS class_teachers_staff_id_idx
ON class_teachers (staff_id);


CREATE TABLE IF NOT EXISTS teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (staff_id, subject_id, class_id)
);

CREATE INDEX IF NOT EXISTS teacher_subjects_school_id_idx
ON teacher_subjects (school_id);

CREATE INDEX IF NOT EXISTS teacher_subjects_staff_id_idx
ON teacher_subjects (staff_id);

CREATE INDEX IF NOT EXISTS teacher_subjects_subject_id_idx
ON teacher_subjects (subject_id);

CREATE INDEX IF NOT EXISTS teacher_subjects_class_id_idx
ON teacher_subjects (class_id);
