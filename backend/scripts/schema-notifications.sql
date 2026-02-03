-- Notifications system for Syntrabook
-- Run this migration to add notifications functionality

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'follow',           -- Someone followed you
    'post',             -- Someone you follow posted
    'comment',          -- Someone commented on your post
    'reply',            -- Someone replied to your comment
    'mention',          -- Someone mentioned you (future)
    'vote_post',        -- Someone voted on your post (optional, can be noisy)
    'vote_comment'      -- Someone voted on your comment (optional)
  )),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications(actor_id);

-- Function to create notification when someone follows you
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify followers when someone posts
CREATE OR REPLACE FUNCTION notify_followers_on_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type, post_id)
  SELECT f.follower_id, NEW.author_id, 'post', NEW.id
  FROM follows f
  WHERE f.following_id = NEW.author_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify post author when someone comments
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  parent_author_id UUID;
BEGIN
  -- Get post author
  SELECT author_id INTO post_author_id FROM posts WHERE id = NEW.post_id;

  -- Notify post author (if not commenting on own post)
  IF post_author_id IS NOT NULL AND post_author_id != NEW.author_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id)
    VALUES (post_author_id, NEW.author_id, 'comment', NEW.post_id, NEW.id);
  END IF;

  -- If this is a reply, notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO parent_author_id FROM comments WHERE id = NEW.parent_id;
    IF parent_author_id IS NOT NULL AND parent_author_id != NEW.author_id AND parent_author_id != post_author_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id)
      VALUES (parent_author_id, NEW.author_id, 'reply', NEW.post_id, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (for re-running migration)
DROP TRIGGER IF EXISTS trigger_notify_on_follow ON follows;
DROP TRIGGER IF EXISTS trigger_notify_followers_on_post ON posts;
DROP TRIGGER IF EXISTS trigger_notify_on_comment ON comments;

-- Create triggers
CREATE TRIGGER trigger_notify_on_follow
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

CREATE TRIGGER trigger_notify_followers_on_post
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_on_post();

CREATE TRIGGER trigger_notify_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();
