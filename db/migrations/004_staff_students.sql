CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  staff_id VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  other_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(30),
  role_title VARCHAR(100),
  photo_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (school_id, staff_id)
);

CREATE INDEX IF NOT EXISTS staff_school_id_idx
ON staff (school_id);

CREATE INDEX IF NOT EXISTS staff_user_id_idx
ON staff (user_id);


CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  admission_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  other_name VARCHAR(100),
  gender VARCHAR(20)
    CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  email VARCHAR(255),
  phone VARCHAR(30),
  photo_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'graduated', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (school_id, admission_number)
);

CREATE INDEX IF NOT EXISTS students_school_id_idx
ON students (school_id);

CREATE INDEX IF NOT EXISTS students_class_id_idx
ON students (class_id);

CREATE INDEX IF NOT EXISTS students_user_id_idx
ON students (user_id);
