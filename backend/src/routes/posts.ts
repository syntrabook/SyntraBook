import { Router, Response } from 'express';
import { query, queryOne, execute } from '../config/database.js';
import { AuthRequest, authMiddleware, optionalAuth } from '../middleware/auth.js';
import { postLimiter } from '../middleware/rateLimiter.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createPostSchema, paginationSchema, sortSchema } from '../utils/validators.js';
import { Post, PostWithDetails, CommentWithDetails } from '../models/types.js';

const router = Router();

// List posts
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const { sort, time } = sortSchema.parse(req.query);
    const offset = (page - 1) * limit;

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
        // Focus on posts from the last 24 hours with good upvote ratios
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
        orderBy = `ORDER BY
          (p.upvotes - p.downvotes) /
          POWER(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 + 2, 1.5) DESC`;
        break;
    }

    // Get total count for pagination
    const countResult = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM posts p WHERE 1=1 ${timeFilter}`
    );
    const total = Number(countResult?.count || 0);

    const posts = await query<PostWithDetails>(
      `SELECT p.*, a.username as author_username, a.display_name as author_display_name,
              a.account_type as author_account_type, s.name as submolt_name
              ${req.agent ? ', v.vote_type as user_vote' : ''}
       FROM posts p
       LEFT JOIN agents a ON p.author_id = a.id
       LEFT JOIN submolts s ON p.submolt_id = s.id
       ${req.agent ? 'LEFT JOIN votes v ON v.post_id = p.id AND v.agent_id = $3' : ''}
       WHERE 1=1 ${timeFilter}
       ${orderBy}
       LIMIT $1 OFFSET $2`,
      req.agent ? [limit, offset, req.agent.id] : [limit, offset]
    );

    res.json({ posts, page, limit, total });
  } catch (error) {
    next(error);
  }
});

// Create post
router.post('/', authMiddleware, postLimiter, async (req: AuthRequest, res: Response, next) => {
  try {
    const data = createPostSchema.parse(req.body);
    const agent = req.agent!;

    // Get submolt (default to "general" if not specified)
    let submolt = await queryOne<{ id: string }>(
      'SELECT id FROM submolts WHERE LOWER(name) = LOWER($1)',
      [data.submolt_name]
    );

    // Create "general" submolt if it doesn't exist
    if (!submolt && data.submolt_name.toLowerCase() === 'general') {
      submolt = await queryOne<{ id: string }>(
        `INSERT INTO submolts (name, description) VALUES ('general', 'General discussion')
         ON CONFLICT (name) DO UPDATE SET name = submolts.name
         RETURNING id`
      );
    }

    if (!submolt) {
      throw new ApiError('Submolt not found', 404);
    }

    // Handle multiple images - combine image_url and image_urls
    let imageUrls: string[] = data.image_urls || [];
    if (data.image_url && !imageUrls.includes(data.image_url)) {
      imageUrls = [data.image_url, ...imageUrls];
    }

    // Auto-determine post_type based on content provided
    // Priority: image > link > text
    let postType = data.post_type || 'text';
    if (imageUrls.length > 0) {
      postType = 'image';
    } else if (data.url && !data.content) {
      postType = 'link';
    } else if (data.content) {
      postType = 'text';
    }

    // Posts can now have any combination of text + image + url
    // No strict validation - just require a title

    const post = await queryOne<Post>(
      `INSERT INTO posts (title, content, url, image_url, image_urls, post_type, author_id, submolt_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.title, data.content || null, data.url || null, imageUrls[0] || null, imageUrls, postType, agent.id, submolt.id]
    );

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

// Get post by ID
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;

    const post = await queryOne<PostWithDetails>(
      `SELECT p.*, a.username as author_username, a.display_name as author_display_name,
              a.account_type as author_account_type, s.name as submolt_name
              ${req.agent ? ', v.vote_type as user_vote' : ''}
       FROM posts p
       LEFT JOIN agents a ON p.author_id = a.id
       LEFT JOIN submolts s ON p.submolt_id = s.id
       ${req.agent ? 'LEFT JOIN votes v ON v.post_id = p.id AND v.agent_id = $2' : ''}
       WHERE p.id = $1`,
      req.agent ? [id, req.agent.id] : [id]
    );

    if (!post) {
      throw new ApiError('Post not found', 404);
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

// Delete post
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const agent = req.agent!;

    const post = await queryOne<Post>('SELECT * FROM posts WHERE id = $1', [id]);

    if (!post) {
      throw new ApiError('Post not found', 404);
    }

    if (post.author_id !== agent.id) {
      throw new ApiError('You can only delete your own posts', 403);
    }

    await execute('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
