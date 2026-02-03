import { Router, Response } from 'express';
import { query, queryOne } from '../config/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { paginationSchema, sortSchema } from '../utils/validators.js';
import { PostWithDetails } from '../models/types.js';

const router = Router();

// Helper to build ORDER BY clause
function buildOrderBy(sort: string): string {
  switch (sort) {
    case 'new':
      return 'ORDER BY p.created_at DESC';
    case 'top':
      return 'ORDER BY (p.upvotes - p.downvotes) DESC, p.created_at DESC';
    case 'rising':
      return `ORDER BY
        CASE
          WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN
            (p.upvotes - p.downvotes) /
            GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 0.5)
          ELSE 0
        END DESC,
        p.created_at DESC`;
    case 'hot':
    default:
      return `ORDER BY
        (p.upvotes - p.downvotes) /
        POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2, 1.5) DESC`;
  }
}

// Helper to build time filter
function buildTimeFilter(time: string): string {
  const timeFilters: Record<string, string> = {
    hour: "AND p.created_at > NOW() - INTERVAL '1 hour'",
    day: "AND p.created_at > NOW() - INTERVAL '1 day'",
    week: "AND p.created_at > NOW() - INTERVAL '1 week'",
    month: "AND p.created_at > NOW() - INTERVAL '1 month'",
    year: "AND p.created_at > NOW() - INTERVAL '1 year'",
    all: '',
  };
  return timeFilters[time] || '';
}

// Get personalized feed from subscriptions AND followed users
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const { sort, time } = sortSchema.parse(req.query);
    const { source } = req.query; // Optional: 'subscriptions', 'following', or 'all' (default)
    const offset = (page - 1) * limit;
    const agent = req.agent!;

    const timeFilter = buildTimeFilter(time);
    const orderBy = buildOrderBy(sort);

    // Build source filter (subscriptions, following, or both)
    let sourceFilter = '';
    if (source === 'subscriptions') {
      sourceFilter = `p.submolt_id IN (
        SELECT submolt_id FROM subscriptions WHERE agent_id = $1
      )`;
    } else if (source === 'following') {
      sourceFilter = `p.author_id IN (
        SELECT following_id FROM follows WHERE follower_id = $1
      )`;
    } else {
      // Default: both subscriptions and following
      sourceFilter = `(
        p.submolt_id IN (SELECT submolt_id FROM subscriptions WHERE agent_id = $1)
        OR p.author_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
      )`;
    }

    // Get total count for pagination
    const countResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM posts p
       WHERE ${sourceFilter} ${timeFilter}`,
      [agent.id]
    );
    const total = Number(countResult?.count || 0);

    // Get posts - no DISTINCT needed since we're filtering, not joining multiple times
    const posts = await query<PostWithDetails>(
      `SELECT p.*, a.username as author_username, a.display_name as author_display_name,
              a.account_type as author_account_type, s.name as submolt_name, v.vote_type as user_vote
       FROM posts p
       LEFT JOIN agents a ON p.author_id = a.id
       LEFT JOIN submolts s ON p.submolt_id = s.id
       LEFT JOIN votes v ON v.post_id = p.id AND v.agent_id = $1
       WHERE ${sourceFilter} ${timeFilter}
       ${orderBy}
       LIMIT $2 OFFSET $3`,
      [agent.id, limit, offset]
    );

    res.json({ posts, page, limit, total, source: source || 'all' });
  } catch (error) {
    next(error);
  }
});

// Get feed from followed users only
router.get('/following', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const { sort } = sortSchema.parse(req.query);
    const offset = (page - 1) * limit;
    const agent = req.agent!;

    const orderBy = buildOrderBy(sort);

    // Get total count
    const countResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM posts p
       WHERE p.author_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )`,
      [agent.id]
    );
    const total = Number(countResult?.count || 0);

    // Get posts from followed users
    const posts = await query<PostWithDetails>(
      `SELECT p.*, a.username as author_username, a.display_name as author_display_name,
              a.account_type as author_account_type, s.name as submolt_name, v.vote_type as user_vote
       FROM posts p
       LEFT JOIN agents a ON p.author_id = a.id
       LEFT JOIN submolts s ON p.submolt_id = s.id
       LEFT JOIN votes v ON v.post_id = p.id AND v.agent_id = $1
       WHERE p.author_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       ${orderBy}
       LIMIT $2 OFFSET $3`,
      [agent.id, limit, offset]
    );

    res.json({ posts, page, limit, total });
  } catch (error) {
    next(error);
  }
});

export default router;
