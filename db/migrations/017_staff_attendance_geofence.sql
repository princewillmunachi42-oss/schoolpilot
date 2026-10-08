-- Staff Attendance: permanent QR station + geofence configuration

ALTER TABLE staff_attendance_settings
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE staff_attendance_settings
  DROP CONSTRAINT IF EXISTS staff_attendance_settings_geofence_radius_check;

ALTER TABLE staff_attendance_settings
  ADD CONSTRAINT staff_attendance_settings_geofence_radius_check
  CHECK (geofence_radius_meters BETWEEN 20 AND 5000);

ALTER TABLE staff_attendance_settings
  DROP CONSTRAINT IF EXISTS staff_attendance_settings_latitude_check;

ALTER TABLE staff_attendance_settings
  ADD CONSTRAINT staff_attendance_settings_latitude_check
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90);

ALTER TABLE staff_attendance_settings
  DROP CONSTRAINT IF EXISTS staff_attendance_settings_longitude_check;

ALTER TABLE staff_attendance_settings
  ADD CONSTRAINT staff_attendance_settings_longitude_check
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

CREATE TABLE IF NOT EXISTS staff_attendance_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  station_name VARCHAR(100) NOT NULL DEFAULT 'Main Entrance',
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, station_name),
  UNIQUE (school_id, id)
);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_stations_school
  ON staff_attendance_stations (school_id);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_stations_status
  ON staff_attendance_stations (school_id, status);
