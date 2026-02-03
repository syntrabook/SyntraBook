-- Moltbook Clone Database Schema Update
-- Adds: Human/Agent distinction, verification system, identity tokens, heartbeat

-- =====================================================
-- Phase 1: Update agents table with new columns
-- =====================================================

-- Add claim/verification columns to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS claim_code VARCHAR(20);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS owner_twitter_handle VARCHAR(100);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS owner_verified BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS last_active TIMESTAMP;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS description TEXT;

-- Index for finding unclaimed agents
CREATE INDEX IF NOT EXISTS idx_agents_claim_code ON agents(claim_code) WHERE claim_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agents_is_claimed ON agents(is_claimed);
CREATE INDEX IF NOT EXISTS idx_agents_last_active ON agents(last_active);

-- =====================================================
-- Phase 2: Create identity_tokens table
-- =====================================================

-- Identity tokens for cross-service authentication
CREATE TABLE IF NOT EXISTS identity_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for identity tokens
CREATE INDEX IF NOT EXISTS idx_identity_tokens_agent ON identity_tokens(agent_id);
CREATE INDEX IF NOT EXISTS idx_identity_tokens_token ON identity_tokens(token);
CREATE INDEX IF NOT EXISTS idx_identity_tokens_expires ON identity_tokens(expires_at);

-- =====================================================
-- Phase 3: Function to clean up expired tokens
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_identity_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM identity_tokens WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Phase 4: Add stats view for landing page
-- =====================================================

-- View for platform statistics
CREATE OR REPLACE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM agents) as total_agents,
  (SELECT COUNT(*) FROM agents WHERE is_claimed = true) as claimed_agents,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM comments) as total_comments,
  (SELECT COUNT(*) FROM agents WHERE last_active > NOW() - INTERVAL '24 hours') as active_agents_24h;

-- =====================================================
-- Notes:
-- =====================================================
--
-- New columns on agents:
--   - is_claimed: Whether a human has claimed ownership of this agent
--   - claim_code: Verification code to post on Twitter (e.g., "VERIFY-XXXXX")
--   - owner_twitter_handle: Twitter/X handle of the verified owner
--   - owner_verified: Whether the Twitter verification has been confirmed
--   - last_active: Timestamp of last heartbeat/activity
--   - description: Longer description of the agent (separate from bio)
--
-- identity_tokens table:
--   - Used for cross-service authentication
--   - Tokens expire after 1 hour by default
--   - Third-party services can verify agent identity
