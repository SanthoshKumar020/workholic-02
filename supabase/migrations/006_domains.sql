-- ============================================================
-- Feature: Domains (roadmap-based gamified learning)
-- ============================================================

-- Per-topic progress within a domain roadmap.
CREATE TABLE IF NOT EXISTS domain_progress (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain     TEXT NOT NULL,
  topic      TEXT NOT NULL,
  stars      INT  DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  status     TEXT DEFAULT 'available'
               CHECK (status IN ('locked', 'available', 'in_progress', 'mastered')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, domain, topic)
);
ALTER TABLE domain_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own domain progress" ON domain_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS domain_progress_user_idx ON domain_progress (user_id, domain);

-- Spaced-repetition items (dsa_srs from migration 004) are reused for domain
-- recall cards via item_id like 'domain:<domain>:<topic>:recall'.
