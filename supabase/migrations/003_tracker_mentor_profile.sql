-- ============================================================
-- Feature: Application Tracker
-- ============================================================
CREATE TABLE IF NOT EXISTS job_applications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company      TEXT NOT NULL,
  role         TEXT NOT NULL,
  url          TEXT,
  location     TEXT,
  salary       TEXT,
  applied_date DATE DEFAULT CURRENT_DATE,
  status       TEXT DEFAULT 'applied'
                 CHECK (status IN ('applied','phone_screen','interview','offer','rejected')),
  notes        TEXT,
  contact_name  TEXT,
  contact_email TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applications" ON job_applications
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Feature: AI Career Mentor
-- ============================================================
CREATE TABLE IF NOT EXISTS mentor_memory (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_text        TEXT,
  target_role        TEXT,
  weekly_plan        TEXT,
  plan_generated_at  TIMESTAMPTZ,
  context_summary    TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mentor_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mentor memory" ON mentor_memory
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS mentor_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mentor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mentor messages" ON mentor_messages
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Feature: Public Profile
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username         TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_bio       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public        BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url     TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_url    TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_certs  JSONB DEFAULT '[]';
-- completed_certs format: [{ "title": "Full Stack Roadmap", "completedAt": "2025-01-15" }]
