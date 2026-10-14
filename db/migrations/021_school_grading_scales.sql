BEGIN;

CREATE TABLE IF NOT EXISTS school_grading_scales (
  school_id UUID PRIMARY KEY REFERENCES schools(id) ON DELETE CASCADE,

  grading_scale JSONB NOT NULL DEFAULT
    '[{"grade":"A","min_score":70,"remarks":"Excellent"},{"grade":"B","min_score":60,"remarks":"Very Good"},{"grade":"C","min_score":50,"remarks":"Good"},{"grade":"D","min_score":45,"remarks":"Fair"},{"grade":"E","min_score":40,"remarks":"Pass"},{"grade":"F","min_score":0,"remarks":"Fail"}]'::jsonb,

  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT school_grading_scale_is_array
    CHECK (jsonb_typeof(grading_scale) = 'array')
);

COMMIT;
