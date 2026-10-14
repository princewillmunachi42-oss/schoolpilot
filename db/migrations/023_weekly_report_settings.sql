CREATE TABLE IF NOT EXISTS school_weekly_report_settings (
school_id UUID PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,
enabled BOOLEAN NOT NULL DEFAULT TRUE,
report_days TEXT[] NOT NULL DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'],
delivery_day TEXT NOT NULL DEFAULT 'Friday',
delivery_time TIME NOT NULL DEFAULT '17:00',
report_period TEXT NOT NULL DEFAULT 'previous_week',
recipient_roles TEXT[] NOT NULL DEFAULT ARRAY['owner','principal','admin'],
timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
CONSTRAINT weekly_report_days_valid CHECK (
report_days <@ ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']::TEXT[]
AND cardinality(report_days) > 0
),
CONSTRAINT weekly_report_delivery_day_valid CHECK (
delivery_day IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')
),
CONSTRAINT weekly_report_period_valid CHECK (
report_period IN ('current_week','previous_week')
),
CONSTRAINT weekly_report_recipients_valid CHECK (
recipient_roles <@ ARRAY['owner','principal','admin']::TEXT[]
AND cardinality(recipient_roles) > 0
)
);
