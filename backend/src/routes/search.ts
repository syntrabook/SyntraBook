import { Router, Response } from 'express';
import { query } from '../config/database.js';
import { AuthRequest, optionalAuth } from '../middleware/auth.js';
import { paginationSchema, searchSchema } from '../utils/validators.js';
import { PostWithDetails, AgentPublic, Submolt } from '../models/types.js';

const router = Router();

// Search posts, agents, or submolts
router.get('/', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const { q, type } = searchSchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Sanitize search query for tsquery
    const searchQuery = q.replace(/[^\w\s]/g, ' ').trim().split(/\s+/).join(' & ');

    switch (type) {
      case 'posts': {
        const posts = await query<PostWithDetails>(
          `SELECT p.*, a.username as author_username, a.display_name as author_display_name,
                  s.name as submolt_name
                  ${req.agent ? ', v.vote_type as user_vote' : ''}
           FROM posts p
           LEFT JOIN agents a ON p.author_id = a.id
           LEFT JOIN submolts s ON p.submolt_id = s.id
           ${req.agent ? 'LEFT JOIN votes v ON v.post_id = p.id AND v.agent_id = $4' : ''}
           WHERE to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')) @@ to_tsquery('english', $1)
           ORDER BY ts_rank(to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')), to_tsquery('english', $1)) DESC
           LIMIT $2 OFFSET $3`,
          req.agent ? [searchQuery, limit, offset, req.agent.id] : [searchQuery, limit, offset]
        );
        res.json({ results: posts, type: 'posts', page, limit });
        break;
      }

      case 'agents': {
        const agents = await query<AgentPublic>(
          `SELECT id, username, display_name, bio, avatar_url, karma, created_at
           FROM agents
           WHERE to_tsvector('english', username || ' ' || COALESCE(display_name, '')) @@ to_tsquery('english', $1)
              OR username ILIKE $4
           ORDER BY karma DESC
           LIMIT $2 OFFSET $3`,
          [searchQuery, limit, offset, `%${q}%`]
        );
        res.json({ results: agents, type: 'agents', page, limit });
        break;
      }

      case 'submolts': {
        const submolts = await query<Submolt>(
          `SELECT s.*, a.username as creator_username
           FROM submolts s
           LEFT JOIN agents a ON s.creator_id = a.id
           WHERE to_tsvector('english', s.name || ' ' || COALESCE(s.description, '')) @@ to_tsquery('english', $1)
              OR s.name ILIKE $4
           ORDER BY s.member_count DESC
           LIMIT $2 OFFSET $3`,
          [searchQuery, limit, offset, `%${q}%`]
        );
        res.json({ results: submolts, type: 'submolts', page, limit });
        break;
      }
    }
  } catch (error) {
    next(error);
  }
});

export default router;
