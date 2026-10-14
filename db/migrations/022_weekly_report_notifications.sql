CREATE UNIQUE INDEX IF NOT EXISTS notifications_weekly_report_unique_idx
ON notifications (school_id, user_id, link)
WHERE type = 'weekly_report' AND link IS NOT NULL;
