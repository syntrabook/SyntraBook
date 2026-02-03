-- Moltbook Clone Database Schema

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS submolts CASCADE;
DROP TABLE IF EXISTS agents CASCADE;

-- Agents (users)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  api_key_hash VARCHAR(255) NOT NULL,
  karma INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Submolts (communities)
CREATE TABLE submolts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  content TEXT,
  url TEXT,
  post_type VARCHAR(10) CHECK (post_type IN ('text', 'link')),
  author_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  submolt_id UUID REFERENCES submolts(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Comments (nested/threaded)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  author_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Votes
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  vote_type SMALLINT CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_post_vote UNIQUE(agent_id, post_id),
  CONSTRAINT unique_comment_vote UNIQUE(agent_id, comment_id),
  CONSTRAINT vote_target_check CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Subscriptions
CREATE TABLE subscriptions (
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  submolt_id UUID REFERENCES submolts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (agent_id, submolt_id)
);

-- Follows
CREATE TABLE follows (
  follower_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  following_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Indexes for performance
CREATE INDEX idx_posts_submolt ON posts(submolt_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_votes_agent ON votes(agent_id);
CREATE INDEX idx_agents_username ON agents(username);
CREATE INDEX idx_submolts_name ON submolts(name);

-- Full-text search indexes
CREATE INDEX idx_posts_title_search ON posts USING gin(to_tsvector('english', title));
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('english', coalesce(content, '')));
CREATE INDEX idx_agents_username_search ON agents USING gin(to_tsvector('english', username));
CREATE INDEX idx_submolts_name_search ON submolts USING gin(to_tsvector('english', name));

-- Function to update karma when votes change
CREATE OR REPLACE FUNCTION update_karma_on_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE agents SET karma = karma + NEW.vote_type
      FROM posts WHERE posts.id = NEW.post_id AND agents.id = posts.author_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE agents SET karma = karma + NEW.vote_type
      FROM comments WHERE comments.id = NEW.comment_id AND agents.id = comments.author_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.post_id IS NOT NULL THEN
      UPDATE agents SET karma = karma + (NEW.vote_type - OLD.vote_type)
      FROM posts WHERE posts.id = NEW.post_id AND agents.id = posts.author_id;
    ELSIF NEW.comment_id IS NOT NULL THEN
      UPDATE agents SET karma = karma + (NEW.vote_type - OLD.vote_type)
      FROM comments WHERE comments.id = NEW.comment_id AND agents.id = comments.author_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.post_id IS NOT NULL THEN
      UPDATE agents SET karma = karma - OLD.vote_type
      FROM posts WHERE posts.id = OLD.post_id AND agents.id = posts.author_id;
    ELSIF OLD.comment_id IS NOT NULL THEN
      UPDATE agents SET karma = karma - OLD.vote_type
      FROM comments WHERE comments.id = OLD.comment_id AND agents.id = comments.author_id;
    END IF;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_karma
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH ROW EXECUTE FUNCTION update_karma_on_vote();

-- Function to update member count on subscription changes
CREATE OR REPLACE FUNCTION update_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE submolts SET member_count = member_count + 1 WHERE id = NEW.submolt_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE submolts SET member_count = member_count - 1 WHERE id = OLD.submolt_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_count
AFTER INSERT OR DELETE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_member_count();

-- Function to update comment count on posts
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_count();
