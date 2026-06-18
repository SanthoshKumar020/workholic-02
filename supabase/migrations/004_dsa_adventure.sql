-- ============================================================
-- Feature: DSA Adventure (learn data structures & algorithms)
-- ============================================================

-- Remember the learner's chosen explanation level: kid | beginner | interview.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dsa_mode TEXT DEFAULT 'beginner'
  CHECK (dsa_mode IN ('kid', 'beginner', 'interview'));

-- Per-topic progress: stars (0–3), mastery %, and lock state.
CREATE TABLE IF NOT EXISTS dsa_progress (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic      TEXT NOT NULL,
  stars      INT  DEFAULT 0 CHECK (stars BETWEEN 0 AND 3),
  mastery    INT  DEFAULT 0 CHECK (mastery BETWEEN 0 AND 100),
  status     TEXT DEFAULT 'locked'
               CHECK (status IN ('locked', 'available', 'in_progress', 'mastered')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, topic)
);
ALTER TABLE dsa_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dsa progress" ON dsa_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Spaced repetition items (SM-2). One row per memorable fact / recall check.
CREATE TABLE IF NOT EXISTS dsa_srs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id     TEXT NOT NULL,                  -- stable id of the fact, e.g. 'stacks-queues:lifo'
  item_type   TEXT NOT NULL DEFAULT 'recall', -- 'recall' | 'complexity' | 'pattern'
  ease        REAL DEFAULT 2.5,
  interval    INT  DEFAULT 0,
  repetitions INT  DEFAULT 0,
  due_date    DATE DEFAULT CURRENT_DATE,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);
ALTER TABLE dsa_srs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dsa srs" ON dsa_srs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Attempt log (games, quizzes, playground runs).
CREATE TABLE IF NOT EXISTS dsa_attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id TEXT NOT NULL,
  passed     BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE dsa_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dsa attempts" ON dsa_attempts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS dsa_srs_due_idx ON dsa_srs (user_id, due_date);
CREATE INDEX IF NOT EXISTS dsa_progress_user_idx ON dsa_progress (user_id);
