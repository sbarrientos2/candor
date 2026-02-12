-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_wallet TEXT NOT NULL,
  actor_wallet TEXT NOT NULL,
  actor_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('vouch', 'follow')),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  amount_lamports BIGINT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_wallet, created_at DESC);

-- Auto-link actor FK from wallet (same pattern as link_photo_creator)
CREATE OR REPLACE FUNCTION link_notification_actor()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actor_id := (SELECT id FROM users WHERE wallet_address = NEW.actor_wallet);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_link_notification_actor
  BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION link_notification_actor();

-- Auto-create notification when someone vouches
CREATE OR REPLACE FUNCTION notify_on_vouch()
RETURNS TRIGGER AS $$
DECLARE
  creator TEXT;
BEGIN
  SELECT creator_wallet INTO creator FROM photos WHERE id = NEW.photo_id;
  IF creator IS NOT NULL AND creator != NEW.voucher_wallet THEN
    INSERT INTO notifications (recipient_wallet, actor_wallet, type, photo_id, amount_lamports)
    VALUES (creator, NEW.voucher_wallet, 'vouch', NEW.photo_id, NEW.amount_lamports);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_on_vouch
  AFTER INSERT ON vouches FOR EACH ROW EXECUTE FUNCTION notify_on_vouch();

-- Auto-create notification when someone follows
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_wallet, actor_wallet, type)
  VALUES (NEW.following_wallet, NEW.follower_wallet, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_on_follow
  AFTER INSERT ON follows FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications are publicly readable" ON notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON notifications FOR UPDATE USING (true);
