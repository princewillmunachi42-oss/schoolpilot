-- Staff Attendance: geofence and station audit data

ALTER TABLE staff_attendance_events
  DROP CONSTRAINT IF EXISTS staff_attendance_events_event_type_check;

ALTER TABLE staff_attendance_events
  ADD CONSTRAINT staff_attendance_events_event_type_check
  CHECK (
    event_type IN (
      'clock_in',
      'clock_out',
      'duplicate_clock_in',
      'duplicate_clock_out',
      'invalid_qr',
      'expired_qr',
      'unauthorized',
      'geofence_denied'
    )
  );

ALTER TABLE staff_attendance_events
  ADD COLUMN IF NOT EXISTS station_id UUID,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS accuracy_meters DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS distance_meters DOUBLE PRECISION;

ALTER TABLE staff_attendance_events
  DROP CONSTRAINT IF EXISTS staff_attendance_events_station_fk;

ALTER TABLE staff_attendance_events
  ADD CONSTRAINT staff_attendance_events_station_fk
  FOREIGN KEY (school_id, station_id)
  REFERENCES staff_attendance_stations (school_id, id)
  ON DELETE SET NULL;

ALTER TABLE staff_attendance_events
  DROP CONSTRAINT IF EXISTS staff_attendance_events_latitude_check;

ALTER TABLE staff_attendance_events
  ADD CONSTRAINT staff_attendance_events_latitude_check
  CHECK (
    latitude IS NULL
    OR latitude BETWEEN -90 AND 90
  );

ALTER TABLE staff_attendance_events
  DROP CONSTRAINT IF EXISTS staff_attendance_events_longitude_check;

ALTER TABLE staff_attendance_events
  ADD CONSTRAINT staff_attendance_events_longitude_check
  CHECK (
    longitude IS NULL
    OR longitude BETWEEN -180 AND 180
  );

ALTER TABLE staff_attendance_events
  DROP CONSTRAINT IF EXISTS staff_attendance_events_accuracy_check;

ALTER TABLE staff_attendance_events
  ADD CONSTRAINT staff_attendance_events_accuracy_check
  CHECK (
    accuracy_meters IS NULL
    OR accuracy_meters >= 0
  );

ALTER TABLE staff_attendance_events
  DROP CONSTRAINT IF EXISTS staff_attendance_events_distance_check;

ALTER TABLE staff_attendance_events
  ADD CONSTRAINT staff_attendance_events_distance_check
  CHECK (
    distance_meters IS NULL
    OR distance_meters >= 0
  );

ALTER TABLE staff_attendance_records
  ADD COLUMN IF NOT EXISTS clock_in_station_id UUID,
  ADD COLUMN IF NOT EXISTS clock_out_station_id UUID;

ALTER TABLE staff_attendance_records
  DROP CONSTRAINT IF EXISTS staff_attendance_records_clock_in_station_fk;

ALTER TABLE staff_attendance_records
  ADD CONSTRAINT staff_attendance_records_clock_in_station_fk
  FOREIGN KEY (school_id, clock_in_station_id)
  REFERENCES staff_attendance_stations (school_id, id)
  ON DELETE SET NULL;

ALTER TABLE staff_attendance_records
  DROP CONSTRAINT IF EXISTS staff_attendance_records_clock_out_station_fk;

ALTER TABLE staff_attendance_records
  ADD CONSTRAINT staff_attendance_records_clock_out_station_fk
  FOREIGN KEY (school_id, clock_out_station_id)
  REFERENCES staff_attendance_stations (school_id, id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_attendance_events_station
  ON staff_attendance_events (school_id, station_id);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_events_type_date
  ON staff_attendance_events (school_id, event_type, event_at);
