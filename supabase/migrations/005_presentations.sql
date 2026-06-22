-- ============================================================
-- Feature: AI Presentation Builder
-- ============================================================
CREATE TABLE IF NOT EXISTS presentations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL DEFAULT 'Untitled deck',
  deck       JSONB NOT NULL,   -- { title, subtitle, theme, slides: [...] }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own presentations" ON presentations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS presentations_user_idx ON presentations (user_id, created_at DESC);
