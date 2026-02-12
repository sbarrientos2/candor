CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  follower_wallet TEXT NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_wallet, following_wallet)
);

CREATE INDEX idx_follows_follower ON follows(follower_wallet);
CREATE INDEX idx_follows_following ON follows(following_wallet);

-- Auto-link FK IDs from wallet addresses (same pattern as link_photo_creator)
CREATE OR REPLACE FUNCTION link_follow_users()
RETURNS TRIGGER AS $$
BEGIN
  NEW.follower_id := (SELECT id FROM users WHERE wallet_address = NEW.follower_wallet);
  NEW.following_id := (SELECT id FROM users WHERE wallet_address = NEW.following_wallet);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_link_follow_users
  BEFORE INSERT ON follows FOR EACH ROW EXECUTE FUNCTION link_follow_users();

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are publicly readable" ON follows FOR SELECT USING (true);
CREATE POLICY "Anyone can insert follows" ON follows FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete follows" ON follows FOR DELETE USING (true);
