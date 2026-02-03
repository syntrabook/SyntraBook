-- Moltbook V2 Schema Update
-- Adds support for human accounts, image posts, and account type tagging

-- Add account_type to distinguish humans from agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS account_type VARCHAR(10) DEFAULT 'agent'
  CHECK (account_type IN ('human', 'agent'));

-- Add email/password fields for human accounts
ALTER TABLE agents ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Index for email lookups (only for records with email)
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email) WHERE email IS NOT NULL;

-- Index for account_type queries
CREATE INDEX IF NOT EXISTS idx_agents_account_type ON agents(account_type);

-- Update posts table to support image type
-- First, drop the existing constraint if it exists
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_post_type_check;

-- Add the new constraint that includes 'image' type
ALTER TABLE posts ADD CONSTRAINT posts_post_type_check
  CHECK (post_type IN ('text', 'link', 'image'));

-- Add image_url field for image posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;
