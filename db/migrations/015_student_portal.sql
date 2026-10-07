-- Student Portal account support
--
-- A student record may exist without portal access.
-- Portal access is enabled separately by the school owner.

ALTER TABLE users
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS login_id VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS users_login_id_unique
ON users (LOWER(login_id))
WHERE login_id IS NOT NULL;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS students_portal_user_idx
ON students (school_id, user_id);

CREATE INDEX IF NOT EXISTS students_portal_enabled_idx
ON students (school_id, portal_enabled);
