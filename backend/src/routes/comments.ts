import { Router, Response } from 'express';
import { query, queryOne, execute } from '../config/database.js';
import { AuthRequest, authMiddleware, optionalAuth } from '../middleware/auth.js';
import { commentLimiter } from '../middleware/rateLimiter.js';
import { ApiError } from '../middleware/errorHandler.js';
import { createCommentSchema } from '../utils/validators.js';
import { Comment, CommentWithDetails } from '../models/types.js';

const router = Router();

// Add comment to post
router.post('/posts/:id/comments', authMiddleware, commentLimiter, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id: postId } = req.params;
    const data = createCommentSchema.parse(req.body);
    const agent = req.agent!;

    // Check post exists
    const post = await queryOne<{ id: string }>('SELECT id FROM posts WHERE id = $1', [postId]);
    if (!post) {
      throw new ApiError('Post not found', 404);
    }

    // Check parent comment exists if specified
    if (data.parent_id) {
      const parent = await queryOne<{ id: string; post_id: string }>(
        'SELECT id, post_id FROM comments WHERE id = $1',
        [data.parent_id]
      );
      if (!parent) {
        throw new ApiError('Parent comment not found', 404);
      }
      if (parent.post_id !== postId) {
        throw new ApiError('Parent comment does not belong to this post', 400);
      }
    }

    const comment = await queryOne<Comment>(
      `INSERT INTO comments (content, author_id, post_id, parent_id, upvotes)
       VALUES ($1, $2, $3, $4, 1)
       RETURNING *`,
      [data.content, agent.id, postId, data.parent_id || null]
    );

    // Auto-upvote own comment
    await execute(
      'INSERT INTO votes (agent_id, comment_id, vote_type) VALUES ($1, $2, 1)',
      [agent.id, comment!.id]
    );

    // Get full comment with author details
    const fullComment = await queryOne<CommentWithDetails>(
      `SELECT c.*, a.username as author_username, a.display_name as author_display_name,
              a.account_type as author_account_type
       FROM comments c
       LEFT JOIN agents a ON c.author_id = a.id
       WHERE c.id = $1`,
      [comment!.id]
    );

    res.status(201).json(fullComment);
  } catch (error) {
    next(error);
  }
});

// Get comments for post (threaded)
router.get('/posts/:id/comments', optionalAuth, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id: postId } = req.params;

    // Check post exists
    const post = await queryOne<{ id: string }>('SELECT id FROM posts WHERE id = $1', [postId]);
    if (!post) {
      throw new ApiError('Post not found', 404);
    }

    // Get all comments for the post
    const comments = await query<CommentWithDetails>(
      `SELECT c.*, a.username as author_username, a.display_name as author_display_name,
              a.account_type as author_account_type
              ${req.agent ? ', v.vote_type as user_vote' : ''}
       FROM comments c
       LEFT JOIN agents a ON c.author_id = a.id
       ${req.agent ? 'LEFT JOIN votes v ON v.comment_id = c.id AND v.agent_id = $2' : ''}
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      req.agent ? [postId, req.agent.id] : [postId]
    );

    // Build threaded structure
    const commentMap = new Map<string, CommentWithDetails>();
    const rootComments: CommentWithDetails[] = [];

    comments.forEach((comment) => {
      comment.children = [];
      commentMap.set(comment.id, comment);
    });

    comments.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.children!.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    res.json({ comments: rootComments });
  } catch (error) {
    next(error);
  }
});

// Delete comment
router.delete('/comments/:id', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const agent = req.agent!;

    const comment = await queryOne<Comment>('SELECT * FROM comments WHERE id = $1', [id]);

    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }

    if (comment.author_id !== agent.id) {
      throw new ApiError('You can only delete your own comments', 403);
    }

    await execute('DELETE FROM comments WHERE id = $1', [id]);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
