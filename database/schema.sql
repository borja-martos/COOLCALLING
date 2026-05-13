-- ============================================================
-- COOLCALLING — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  website     TEXT,
  company     TEXT,
  brief       JSONB,   -- { insight, pain, hook, objection }
  status      TEXT DEFAULT 'pending',  -- pending | called | interested | followup | no_answer | not_interested
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- CALLS
CREATE TABLE IF NOT EXISTS calls (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id          UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  result           TEXT,   -- interested | followup | no_answer | not_interested
  voice_notes      TEXT,
  email_generated  TEXT,
  duration_seconds INTEGER DEFAULT 0,
  xp_earned        INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- USER STATS
CREATE TABLE IF NOT EXISTS user_stats (
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  total_xp        INTEGER DEFAULT 0,
  streak_days     INTEGER DEFAULT 0,
  last_active_date DATE,
  level           INTEGER DEFAULT 1,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create stats row on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own leads"      ON leads      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own calls"      ON calls      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own stats"      ON user_stats FOR ALL USING (auth.uid() = user_id);
