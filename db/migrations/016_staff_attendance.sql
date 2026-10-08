CREATE TABLE IF NOT EXISTS staff_attendance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL UNIQUE
    REFERENCES schools(id) ON DELETE CASCADE,

  clock_in_time TIME,
  clock_out_time TIME,

  late_grace_minutes INTEGER NOT NULL DEFAULT 15
    CHECK (late_grace_minutes >= 0 AND late_grace_minutes <= 240),

  timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Lagos',

  monday_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  tuesday_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  wednesday_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  thursday_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  friday_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  saturday_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sunday_enabled BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS staff_attendance_qr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL
    REFERENCES schools(id) ON DELETE CASCADE,

  token_hash VARCHAR(64) NOT NULL UNIQUE,

  expires_at TIMESTAMPTZ NOT NULL,

  created_by UUID NOT NULL
    REFERENCES users(id) ON DELETE RESTRICT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (school_id, id)
);

CREATE INDEX IF NOT EXISTS staff_attendance_qr_sessions_school_idx
ON staff_attendance_qr_sessions (school_id);

CREATE INDEX IF NOT EXISTS staff_attendance_qr_sessions_expires_idx
ON staff_attendance_qr_sessions (expires_at);


CREATE TABLE IF NOT EXISTS staff_attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES schools(id) ON DELETE CASCADE,

  staff_id UUID NOT NULL,

  attendance_date DATE NOT NULL,

  clock_in_at TIMESTAMPTZ,
  clock_out_at TIMESTAMPTZ,

  status VARCHAR(20) NOT NULL DEFAULT 'present'
    CHECK (status IN ('present', 'late')),

  late_minutes INTEGER NOT NULL DEFAULT 0
    CHECK (late_minutes >= 0),

  clock_in_qr_session_id UUID,
  clock_out_qr_session_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT staff_attendance_unique_staff_date
    UNIQUE (school_id, staff_id, attendance_date),

  CONSTRAINT staff_attendance_staff_school_fk
    FOREIGN KEY (school_id, staff_id)
    REFERENCES staff (school_id, id)
    ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS staff_attendance_records_school_date_idx
ON staff_attendance_records (school_id, attendance_date);

CREATE INDEX IF NOT EXISTS staff_attendance_records_staff_date_idx
ON staff_attendance_records (school_id, staff_id, attendance_date);

CREATE INDEX IF NOT EXISTS staff_attendance_records_status_idx
ON staff_attendance_records (school_id, status);


ALTER TABLE staff_attendance_records
  ADD CONSTRAINT staff_attendance_clock_in_qr_school_fk
  FOREIGN KEY (school_id, clock_in_qr_session_id)
  REFERENCES staff_attendance_qr_sessions (school_id, id)
  ON DELETE SET NULL;

ALTER TABLE staff_attendance_records
  ADD CONSTRAINT staff_attendance_clock_out_qr_school_fk
  FOREIGN KEY (school_id, clock_out_qr_session_id)
  REFERENCES staff_attendance_qr_sessions (school_id, id)
  ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS staff_attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  school_id UUID NOT NULL
    REFERENCES schools(id) ON DELETE CASCADE,

  staff_id UUID,

  qr_session_id UUID,

  event_type VARCHAR(30) NOT NULL
    CHECK (
      event_type IN (
        'clock_in',
        'clock_out',
        'duplicate_clock_in',
        'duplicate_clock_out',
        'invalid_qr',
        'expired_qr',
        'unauthorized'
      )
    ),

  event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT staff_attendance_event_staff_school_fk
    FOREIGN KEY (school_id, staff_id)
    REFERENCES staff (school_id, id)
    ON DELETE SET NULL,

  CONSTRAINT staff_attendance_event_qr_school_fk
    FOREIGN KEY (school_id, qr_session_id)
    REFERENCES staff_attendance_qr_sessions (school_id, id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS staff_attendance_events_school_date_idx
ON staff_attendance_events (school_id, event_at);

CREATE INDEX IF NOT EXISTS staff_attendance_events_staff_date_idx
ON staff_attendance_events (school_id, staff_id, event_at);
