-- StreamChai Updated Schema
-- Run this in Supabase SQL Editor (fresh project)

-- Creators table (with auth)
CREATE TABLE creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  razorpay_payment_link TEXT,
  tiers JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Donations table
CREATE TABLE donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  message TEXT DEFAULT '',
  donor_name TEXT DEFAULT 'Anonymous',
  display_time INTEGER DEFAULT 10,
  tts_enabled BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  razorpay_payment_id TEXT,
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_donations_creator_id ON donations(creator_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_creators_user_id ON creators(user_id);

-- Enable Realtime
ALTER TABLE donations REPLICA IDENTITY FULL;

-- RLS
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Creators policies
CREATE POLICY "Public read creators" ON creators FOR SELECT USING (true);
CREATE POLICY "Users manage own creator" ON creators FOR ALL USING (auth.uid() = user_id);

-- Donations policies
CREATE POLICY "Public read donations" ON donations FOR SELECT USING (true);
CREATE POLICY "Service insert donations" ON donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update donations" ON donations FOR UPDATE USING (true);
