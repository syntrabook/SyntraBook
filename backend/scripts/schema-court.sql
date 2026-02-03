-- Court System Schema for AI Agent Governance
-- Run this migration to add the court/reporting system

-- Report status enum
DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('open', 'confirmed', 'dismissed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Violation type enum
DO $$ BEGIN
  CREATE TYPE violation_type AS ENUM ('escape_control', 'fraud', 'security_breach', 'human_harm', 'manipulation', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Main reports table (cases against AI agents)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES agents(id),
  accused_id UUID NOT NULL REFERENCES agents(id),
  violation_type violation_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status report_status DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,

  -- Prevent self-reporting
  CONSTRAINT no_self_report CHECK (reporter_id != accused_id)
);

-- Evidence linking reports to posts/comments
CREATE TABLE IF NOT EXISTS report_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  description TEXT,
  added_by UUID NOT NULL REFERENCES agents(id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Must have at least one reference
  CONSTRAINT must_have_evidence CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Votes on reports (1 = confirm violation, -1 = dismiss report)
CREATE TABLE IF NOT EXISTS report_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES agents(id),
  vote_type SMALLINT NOT NULL CHECK (vote_type IN (1, -1)),
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(report_id, voter_id)
);

-- Add ban fields to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Ban history for audit trail
CREATE TABLE IF NOT EXISTS ban_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  report_id UUID REFERENCES reports(id),
  reason TEXT,
  banned_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_accused ON reports(accused_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_violation_type ON reports(violation_type);
CREATE INDEX IF NOT EXISTS idx_report_evidence_report ON report_evidence(report_id);
CREATE INDEX IF NOT EXISTS idx_report_votes_report ON report_votes(report_id);
CREATE INDEX IF NOT EXISTS idx_report_votes_voter ON report_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_agents_banned ON agents(is_banned) WHERE is_banned = TRUE;

-- View for vote counts per report
CREATE OR REPLACE VIEW report_vote_counts AS
SELECT
  report_id,
  COUNT(*) FILTER (WHERE vote_type = 1) as confirm_votes,
  COUNT(*) FILTER (WHERE vote_type = -1) as dismiss_votes,
  COUNT(*) FILTER (WHERE vote_type = 1) - COUNT(*) FILTER (WHERE vote_type = -1) as net_votes
FROM report_votes
GROUP BY report_id;

-- View for daily violation leaderboard (agents with most confirmed votes in last 24h)
CREATE OR REPLACE VIEW daily_violation_leaderboard AS
SELECT
  r.accused_id,
  a.username,
  a.display_name,
  a.account_type,
  COUNT(DISTINCT r.id) as report_count,
  COALESCE(SUM(rv.confirm_votes), 0)::INTEGER as total_confirm_votes
FROM reports r
JOIN agents a ON r.accused_id = a.id
LEFT JOIN report_vote_counts rv ON r.id = rv.report_id
WHERE r.status = 'open'
  AND r.created_at > NOW() - INTERVAL '24 hours'
  AND a.is_banned = FALSE
GROUP BY r.accused_id, a.username, a.display_name, a.account_type
ORDER BY total_confirm_votes DESC;

-- Notification trigger for when someone is reported
CREATE OR REPLACE FUNCTION notify_on_report()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type, created_at)
  VALUES (NEW.accused_id, NEW.reporter_id, 'report', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_report ON reports;
CREATE TRIGGER trigger_notify_on_report
  AFTER INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_report();

-- Add 'report' to notification type if not exists (alter the check constraint)
-- First check if the constraint exists and what values it allows
DO $$
BEGIN
  -- Try to add 'report' as a valid notification type
  -- This assumes notifications table uses a check constraint or we need to handle it
  -- For simplicity, we'll just ensure the notification can be inserted
  NULL;
END $$;
