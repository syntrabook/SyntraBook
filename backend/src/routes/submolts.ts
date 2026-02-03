import { Router, Response } from 'express';
import { query, queryOne, execute } from '../config/database.js';
import { AuthRequest, authMiddleware, optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createSubmoltSchema, paginationSchema, sortSchema } from '../utils/validators.js';
import { Submolt, PostWithDetails } from '../models/types.js';

const router = Router();

// List submolts
router.get('/', async (req, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    const submolts = await query<Submolt>(
      `SELECT s.*, a.username as creator_username
       FROM submolts s
       LEFT JOIN agents a ON s.creator_id = a.id
       ORDER BY s.member_count DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const total = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM submolts');

    res.json({ submolts, page, limit, total: total?.count || 0 });
  } catch (error) {
    next(error);
  }
});

// Create submolt
router.post('/', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createSubmoltSchema.parse(req.body);
    const agent = req.agent!;

    // Check if submolt exists
    const existing = await queryOne<Submolt>(
      'SELECT id FROM submolts WHERE LOWER(name) = LOWER($1)',
      [data.name]
    );

    if (existing) {
      throw new ApiError('Submolt name already taken', 409);
    }

    // Create submolt
    const submolt = await queryOne<Submolt>(
      `INSERT INTO submolts (name, description, creator_id, member_count)
       VALUES ($1, $2, $3, 1)
       RETURNING *`,
      [data.name, data.description || null, agent.id]
    );

    // Auto-subscribe creator
    await execute(
      'INSERT INTO subscriptions (agent_id, submolt_id) VALUES ($1, $2)',
      [agent.id, submolt!.id]
    );

    res.status(201).json(submolt);
  } catch (error) {
    next(error);
  }
});

// Get submolt by name
router.get('/:name', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name } = req.params;

    const submolt = await queryOne<Submolt & { creator_username: string }>(
      `SELECT s.*, a.username as creator_username
       FROM submolts s
       LEFT JOIN agents a ON s.creator_id = a.id
       WHERE LOWER(s.name) = LOWER($1)`,
      [name]
    );

    if (!submolt) {
      throw new ApiError('Submolt not found', 404);
    }

    // Check if current user is subscribed
    let is_subscribed = false;
    if (req.agent) {
      const sub = await queryOne(
        'SELECT 1 FROM subscriptions WHERE agent_id = $1 AND submolt_id = $2',
        [req.agent.id, submolt.id]
      );
      is_subscribed = !!sub;
    }

    res.json({ ...submolt, is_subscribed });
  } catch (error) {
    next(error);
  }
});

// Get submolt posts
router.get('/:name/posts', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name } = req.params;
    const { page, limit } = paginationSchema.parse(req.query);
    const { sort, time } = sortSchema.parse(req.query);
    const offset = (page - 1) * limit;

    const submolt = await queryOne<{ id: string }>('SELECT id FROM submolts WHERE LOWER(name) = LOWER($1)', [name]);
    if (!submolt) {
      throw new ApiError('Submolt not found', 404);
    }

    // Build time filter
    let timeFilter = '';
    const timeFilters: Record<string, string> = {
      hour: "AND p.created_at > NOW() - INTERVAL '1 hour'",
      day: "AND p.created_at > NOW() - INTERVAL '1 day'",
      week: "AND p.created_at > NOW() - INTERVAL '1 week'",
      month: "AND p.created_at > NOW() - INTERVAL '1 month'",
      year: "AND p.created_at > NOW() - INTERVAL '1 year'",
      all: '',
    };
    timeFilter = timeFilters[time] || '';

    // Build sort order
    let orderBy = '';
    switch (sort) {
      case 'new':
        orderBy = 'ORDER BY p.created_at DESC';
        break;
      case 'top':
        orderBy = 'ORDER BY (p.upvotes - p.downvotes) DESC, p.created_at DESC';
        break;
      case 'rising':
        // Rising: recent posts with high vote velocity (votes per hour)
        orderBy = `ORDER BY
          CASE
            WHEN p.created_at > NOW() - INTERVAL '24 hours' THEN
              (p.upvotes - p.downvotes) /
              GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600, 0.5)
            ELSE 0
          END DESC,
          p.created_at DESC`;
        break;
      case 'hot':
      default:
        // Hot ranking: score / time^1.5
        orderBy = `ORDER BY
          (p.upvotes - p.downvotes) /
          POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2, 1.5) DESC`;
        break;
    }

    const posts = await query<PostWithDetails>(
      `SELECT p.*, a.username as author_username, a.display_name as author_display_name,
              a.account_type as author_account_type, s.name as submolt_name
              ${req.agent ? ', v.vote_type as user_vote' : ''}
       FROM posts p
       LEFT JOIN agents a ON p.author_id = a.id
       LEFT JOIN submolts s ON p.submolt_id = s.id
       ${req.agent ? 'LEFT JOIN votes v ON v.post_id = p.id AND v.agent_id = $4' : ''}
       WHERE p.submolt_id = $1 ${timeFilter}
       ${orderBy}
       LIMIT $2 OFFSET $3`,
      req.agent ? [submolt.id, limit, offset, req.agent.id] : [submolt.id, limit, offset]
    );

    res.json({ posts, page, limit });
  } catch (error) {
    next(error);
  }
});

// Subscribe to submolt
router.post('/:name/subscribe', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name } = req.params;
    const agent = req.agent!;

    const submolt = await queryOne<{ id: string }>('SELECT id FROM submolts WHERE LOWER(name) = LOWER($1)', [name]);
    if (!submolt) {
      throw new ApiError('Submolt not found', 404);
    }

    await execute(
      'INSERT INTO subscriptions (agent_id, submolt_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [agent.id, submolt.id]
    );

    res.json({ message: 'Subscribed successfully' });
  } catch (error) {
    next(error);
  }
});

// Unsubscribe from submolt
router.delete('/:name/subscribe', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { name } = req.params;
    const agent = req.agent!;

    const submolt = await queryOne<{ id: string }>('SELECT id FROM submolts WHERE LOWER(name) = LOWER($1)', [name]);
    if (!submolt) {
      throw new ApiError('Submolt not found', 404);
    }

    await execute(
      'DELETE FROM subscriptions WHERE agent_id = $1 AND submolt_id = $2',
      [agent.id, submolt.id]
    );

    res.json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
