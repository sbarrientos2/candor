-- Candor: Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ─── Tables ──────────────────────────────────────────────────────────────────

-- Users (wallet-based identity)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT DEFAULT 'Anon',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos (verified moments)
CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  creator_wallet TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_hash TEXT NOT NULL,
  caption TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_accuracy DOUBLE PRECISION,
  verification_tx TEXT,
  vouch_count INTEGER DEFAULT 0,
  total_earned_lamports BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vouches (paid appreciations)
CREATE TABLE vouches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  voucher_id UUID REFERENCES users(id),
  voucher_wallet TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL,
  tx_signature TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, voucher_wallet)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_photos_created ON photos(created_at DESC);
CREATE INDEX idx_photos_creator ON photos(creator_wallet);
CREATE INDEX idx_vouches_photo ON vouches(photo_id);
CREATE INDEX idx_vouches_voucher ON vouches(voucher_wallet);

-- ─── Auto-link creator_id on photo insert ────────────────────────────────────

CREATE OR REPLACE FUNCTION link_photo_creator()
RETURNS TRIGGER AS $$
BEGIN
  NEW.creator_id := (
    SELECT id FROM users WHERE wallet_address = NEW.creator_wallet
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_link_photo_creator
  BEFORE INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION link_photo_creator();

-- Auto-link voucher_id on vouch insert
CREATE OR REPLACE FUNCTION link_voucher_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.voucher_id := (
    SELECT id FROM users WHERE wallet_address = NEW.voucher_wallet
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_link_voucher_user
  BEFORE INSERT ON vouches
  FOR EACH ROW
  EXECUTE FUNCTION link_voucher_user();

-- ─── RPC function: increment vouch count and earnings ────────────────────────

CREATE OR REPLACE FUNCTION increment_vouch(p_photo_id UUID, p_amount BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE photos
  SET vouch_count = vouch_count + 1,
      total_earned_lamports = total_earned_lamports + p_amount
  WHERE id = p_photo_id;
END;
$$ LANGUAGE plpgsql;

-- ─── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouches ENABLE ROW LEVEL SECURITY;

-- Users: anyone can read, only the user can update their own profile
CREATE POLICY "Users are publicly readable"
  ON users FOR SELECT USING (true);

CREATE POLICY "Users can insert themselves"
  ON users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE USING (true);

-- Photos: anyone can read, authenticated users can insert
CREATE POLICY "Photos are publicly readable"
  ON photos FOR SELECT USING (true);

CREATE POLICY "Anyone can insert photos"
  ON photos FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update photos"
  ON photos FOR UPDATE USING (true);

-- Vouches: anyone can read, authenticated users can insert
CREATE POLICY "Vouches are publicly readable"
  ON vouches FOR SELECT USING (true);

CREATE POLICY "Anyone can insert vouches"
  ON vouches FOR INSERT WITH CHECK (true);

-- ─── Storage ─────────────────────────────────────────────────────────────────
-- Run these separately in Supabase Dashboard → Storage:
-- 1. Create a bucket named "photos" (public)
-- 2. Or run:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);
