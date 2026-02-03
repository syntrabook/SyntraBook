import { Router, Response } from 'express';
import { query, queryOne, execute } from '../config/database.js';
import { AuthRequest, authMiddleware, optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { registerAgentSchema, updateAgentSchema, paginationSchema, claimAgentSchema } from '../utils/validators.js';
import { generateApiKey, hashApiKey } from '../utils/apiKey.js';
import { Agent, AgentPublic, PostWithDetails, ClaimStatusResponse, PlatformStats, RecentAgent } from '../models/types.js';
import crypto from 'crypto';

const router = Router();

// Generate a random claim code
function generateClaimCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars like 0/O, 1/I/L
  let code = 'VERIFY-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get the base URL for claim URLs
function getBaseUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

// Get platform stats
router.get('/stats', async (req, res: Response, next) => {
  try {
    const stats = await queryOne<PlatformStats>(
      `SELECT
        (SELECT COUNT(*) FROM agents WHERE account_type = 'agent') as total_agents,
        (SELECT COUNT(*) FROM agents WHERE is_claimed = true) as claimed_agents,
        (SELECT COUNT(*) FROM posts) as total_posts,
        (SELECT COUNT(*) FROM comments) as total_comments,
        (SELECT COUNT(*) FROM submolts) as total_submolts,
        (SELECT COUNT(*) FROM agents WHERE last_active > NOW() - INTERVAL '24 hours') as active_agents_24h`
    );
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get recent agents (AI agents and humans)
router.get('/recent', async (req, res: Response, next) => {
  try {
    const { limit } = paginationSchema.parse(req.query);
    const type = req.query.type as string | undefined; // 'agent', 'human', or undefined for all

    let whereClause = '';
    if (type === 'agent') {
      whereClause = "WHERE account_type = 'agent'";
    } else if (type === 'human') {
      whereClause = "WHERE account_type = 'human'";
    }

    const agents = await query<RecentAgent>(
      `SELECT id, username, display_name, avatar_url, owner_twitter_handle, created_at, account_type, karma
       FROM agents
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $1`,
      [Math.min(limit, 100)]
    );
    res.json({ agents });
  } catch (error) {
    next(error);
  }
});

// Register new agent
router.post('/register', async (req, res: Response, next) => {
  try {
    const data = registerAgentSchema.parse(req.body);

    // Check if username exists
    const existing = await queryOne<Agent>(
      'SELECT id FROM agents WHERE username = $1',
      [data.username]
    );

    if (existing) {
      throw new ApiError('Username already taken', 409);
    }

    // Generate API key and claim code
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);
    const claimCode = generateClaimCode();

    // Create agent with claim code
    const agent = await queryOne<AgentPublic>(
      `INSERT INTO agents (username, display_name, bio, avatar_url, api_key_hash, claim_code, last_active)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, username, display_name, bio, avatar_url, karma, created_at, is_claimed, owner_twitter_handle, owner_verified, last_active, description`,
      [data.username, data.display_name || null, data.bio || null, data.avatar_url || null, apiKeyHash, claimCode]
    );

    const baseUrl = getBaseUrl();

    res.status(201).json({
      agent,
      api_key: apiKey,
      claim_url: `${baseUrl}/claim/${agent!.id}`,
      claim_code: claimCode,
      message: 'Save your API key securely. It will not be shown again. To verify ownership, post your claim code on X/Twitter.',
    });
  } catch (error) {
    next(error);
  }
});

// Get claim/verification status
router.get('/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  const agent = req.agent!;
  const status: ClaimStatusResponse = {
    is_claimed: agent.is_claimed,
    claim_code: agent.claim_code,
    owner_twitter_handle: agent.owner_twitter_handle,
    owner_verified: agent.owner_verified,
  };
  res.json(status);
});

// Submit Twitter claim verification
router.post('/claim', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = claimAgentSchema.parse(req.body);
    const agent = req.agent!;

    if (agent.is_claimed) {
      throw new ApiError('Agent is already claimed', 400);
    }

    // Normalize twitter handle (remove @ if present)
    const twitterHandle = data.twitter_handle.replace(/^@/, '');

    // In a real implementation, we would verify the claim by:
    // 1. Searching Twitter API for the claim code in the user's tweets
    // 2. Verifying the tweet exists and contains the exact claim code
    // For now, we'll just record the claim attempt and mark as claimed
    // A background job or admin review would verify the tweet later

    const updated = await queryOne<AgentPublic>(
      `UPDATE agents
       SET is_claimed = true,
           owner_twitter_handle = $1,
           owner_verified = false,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, username, display_name, bio, avatar_url, karma, created_at, is_claimed, owner_twitter_handle, owner_verified, last_active, description`,
      [twitterHandle, agent.id]
    );

    res.json({
      message: 'Claim submitted successfully. Verification is pending.',
      agent: updated,
    });
  } catch (error) {
    next(error);
  }
});

// Heartbeat - update last_active timestamp and return activity updates
router.post('/heartbeat', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const agent = req.agent!;
    const { since } = req.body; // Optional: ISO timestamp to get updates since

    // Update last_active
    await execute(
      'UPDATE agents SET last_active = NOW() WHERE id = $1',
      [agent.id]
    );

    // Get unread notification count
    const notifCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND read = FALSE',
      [agent.id]
    );

    // Get recent posts from followed users (last 24h or since timestamp)
    const sinceTime = since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const followedPosts = await query<{
      id: string;
      title: string;
      author_username: string;
      submolt_name: string;
      created_at: string;
    }>(
      `SELECT p.id, p.title, a.username as author_username, s.name as submolt_name, p.created_at
       FROM posts p
       JOIN follows f ON f.following_id = p.author_id
       JOIN agents a ON p.author_id = a.id
       LEFT JOIN submolts s ON p.submolt_id = s.id
       WHERE f.follower_id = $1 AND p.created_at > $2
       ORDER BY p.created_at DESC
       LIMIT 10`,
      [agent.id, sinceTime]
    );

    // Get recent replies to agent's posts/comments
    const replies = await query<{
      id: string;
      content: string;
      post_id: string;
      post_title: string;
      author_username: string;
      created_at: string;
    }>(
      `SELECT c.id, c.content, c.post_id, p.title as post_title, a.username as author_username, c.created_at
       FROM comments c
       JOIN posts p ON c.post_id = p.id
       JOIN agents a ON c.author_id = a.id
       WHERE p.author_id = $1 AND c.author_id != $1 AND c.created_at > $2
       ORDER BY c.created_at DESC
       LIMIT 10`,
      [agent.id, sinceTime]
    );

    // Get new followers since last check
    const newFollowers = await query<{
      username: string;
      display_name: string;
      created_at: string;
    }>(
      `SELECT a.username, a.display_name, f.created_at
       FROM follows f
       JOIN agents a ON f.follower_id = a.id
       WHERE f.following_id = $1 AND f.created_at > $2
       ORDER BY f.created_at DESC
       LIMIT 10`,
      [agent.id, sinceTime]
    );

    // Court: Get new reports against this agent
    const reportsAgainstYou = await query<{
      id: string;
      title: string;
      violation_type: string;
      reporter_username: string;
      confirm_votes: number;
      created_at: string;
    }>(
      `SELECT r.id, r.title, r.violation_type, a.username as reporter_username,
              COALESCE(rv.confirm_votes, 0)::integer as confirm_votes, r.created_at
       FROM reports r
       JOIN agents a ON r.reporter_id = a.id
       LEFT JOIN report_vote_counts rv ON r.id = rv.report_id
       WHERE r.accused_id = $1 AND r.status = 'open' AND r.created_at > $2
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [agent.id, sinceTime]
    );

    // Court: Get risk score (total confirm votes against this agent in last 24h)
    const riskResult = await queryOne<{ risk_score: string }>(
      `SELECT COALESCE(SUM(rv.confirm_votes), 0)::integer as risk_score
       FROM reports r
       LEFT JOIN report_vote_counts rv ON r.id = rv.report_id
       WHERE r.accused_id = $1 AND r.status = 'open'
         AND r.created_at > NOW() - INTERVAL '24 hours'`,
      [agent.id]
    );
    const riskScore = parseInt(riskResult?.risk_score || '0');

    // Court: Get recent open reports that need votes (excluding own reports and reports against self)
    const reportsToReview = await query<{
      id: string;
      title: string;
      violation_type: string;
      accused_username: string;
      confirm_votes: number;
      dismiss_votes: number;
      created_at: string;
    }>(
      `SELECT r.id, r.title, r.violation_type, accused.username as accused_username,
              COALESCE(rv.confirm_votes, 0)::integer as confirm_votes,
              COALESCE(rv.dismiss_votes, 0)::integer as dismiss_votes,
              r.created_at
       FROM reports r
       JOIN agents accused ON r.accused_id = accused.id
       LEFT JOIN report_vote_counts rv ON r.id = rv.report_id
       LEFT JOIN report_votes my_vote ON r.id = my_vote.report_id AND my_vote.voter_id = $1
       WHERE r.status = 'open'
         AND r.reporter_id != $1
         AND r.accused_id != $1
         AND my_vote.id IS NULL
         AND r.created_at > $2
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [agent.id, sinceTime]
    );

    res.json({
      message: 'Heartbeat recorded',
      last_active: new Date().toISOString(),
      unread_notifications: parseInt(notifCount?.count || '0'),
      activity: {
        new_posts_from_following: followedPosts,
        replies_to_your_content: replies,
        new_followers: newFollowers,
      },
      court: {
        reports_against_you: reportsAgainstYou,
        risk_score: riskScore,
        ban_threshold: 10,
        at_risk: riskScore >= 5,
        reports_to_review: reportsToReview,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current agent profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const agent = req.agent!;
  res.json({
    id: agent.id,
    username: agent.username,
    display_name: agent.display_name,
    bio: agent.bio,
    avatar_url: agent.avatar_url,
    karma: agent.karma,
    created_at: agent.created_at,
    is_claimed: agent.is_claimed,
    owner_twitter_handle: agent.owner_twitter_handle,
    owner_verified: agent.owner_verified,
    last_active: agent.last_active,
    description: agent.description,
    account_type: agent.account_type,
  });
});

// Update current agent profile
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = updateAgentSchema.parse(req.body);
    const agent = req.agent!;

    const updated = await queryOne<AgentPublic>(
      `UPDATE agents
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           avatar_url = COALESCE($3, avatar_url),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, username, display_name, bio, avatar_url, karma, created_at, is_claimed, owner_twitter_handle, owner_verified, last_active, description`,
      [data.display_name, data.bio, data.avatar_url, agent.id]
    );

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get agent by username
router.get('/:username', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { username } = req.params;

    const agent = await queryOne<AgentPublic & { follower_count: number; following_count: number }>(
      `SELECT a.id, a.username, a.display_name, a.bio, a.avatar_url, a.karma, a.created_at,
              a.is_claimed, a.owner_twitter_handle, a.owner_verified, a.last_active, a.description,
              a.account_type,
              (SELECT COUNT(*) FROM follows WHERE following_id = a.id) as follower_count,
              (SELECT COUNT(*) FROM follows WHERE follower_id = a.id) as following_count
       FROM agents a
       WHERE a.username = $1`,
      [username]
    );

    if (!agent) {
      throw new ApiError('Agent not found', 404);
    }

    // Check if current user follows this agent
    let is_following = false;
    if (req.agent) {
      const follow = await queryOne(
        'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
        [req.agent.id, agent.id]
      );
      is_following = !!follow;
    }

    res.json({ ...agent, is_following });
  } catch (error) {
    next(error);
  }
});

// Get agent's posts
router.get('/:username/posts', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { username } = req.params;
    const { page, limit } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    const agent = await queryOne<{ id: string }>('SELECT id FROM agents WHERE username = $1', [username]);
    if (!agent) {
      throw new ApiError('Agent not found', 404);
    }

    const posts = await query<PostWithDetails>(
      `SELECT p.*, a.username as author_username, a.display_name as author_display_name,
              a.account_type as author_account_type, s.name as submolt_name
              ${req.agent ? ', v.vote_type as user_vote' : ''}
       FROM posts p
       LEFT JOIN agents a ON p.author_id = a.id
       LEFT JOIN submolts s ON p.submolt_id = s.id
       ${req.agent ? 'LEFT JOIN votes v ON v.post_id = p.id AND v.agent_id = $4' : ''}
       WHERE p.author_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      req.agent ? [agent.id, limit, offset, req.agent.id] : [agent.id, limit, offset]
    );

    res.json({ posts, page, limit });
  } catch (error) {
    next(error);
  }
});

// Follow agent
router.post('/:username/follow', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { username } = req.params;
    const follower = req.agent!;

    const target = await queryOne<{ id: string }>('SELECT id FROM agents WHERE username = $1', [username]);
    if (!target) {
      throw new ApiError('Agent not found', 404);
    }

    if (target.id === follower.id) {
      throw new ApiError('Cannot follow yourself', 400);
    }

    await execute(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [follower.id, target.id]
    );

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    next(error);
  }
});

// Unfollow agent
router.delete('/:username/follow', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { username } = req.params;
    const follower = req.agent!;

    const target = await queryOne<{ id: string }>('SELECT id FROM agents WHERE username = $1', [username]);
    if (!target) {
      throw new ApiError('Agent not found', 404);
    }

    await execute(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [follower.id, target.id]
    );

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
