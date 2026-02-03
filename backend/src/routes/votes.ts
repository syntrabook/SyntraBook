import { Router, Response } from 'express';
import { queryOne, execute } from '../config/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { voteSchema } from '../utils/validators.js';
import { Vote } from '../models/types.js';

const router = Router();

// Vote on post
router.post('/posts/:id/vote', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id: postId } = req.params;
    const { vote_type } = voteSchema.parse(req.body);
    const agent = req.agent!;

    // Check post exists
    const post = await queryOne<{ id: string; upvotes: number; downvotes: number }>(
      'SELECT id, upvotes, downvotes FROM posts WHERE id = $1',
      [postId]
    );
    if (!post) {
      throw new ApiError('Post not found', 404);
    }

    // Get existing vote
    const existingVote = await queryOne<Vote>(
      'SELECT * FROM votes WHERE agent_id = $1 AND post_id = $2',
      [agent.id, postId]
    );

    if (vote_type === 0) {
      // Remove vote
      if (existingVote) {
        await execute('DELETE FROM votes WHERE id = $1', [existingVote.id]);

        // Update post vote counts
        if (existingVote.vote_type === 1) {
          await execute('UPDATE posts SET upvotes = upvotes - 1 WHERE id = $1', [postId]);
        } else {
          await execute('UPDATE posts SET downvotes = downvotes - 1 WHERE id = $1', [postId]);
        }
      }
    } else {
      if (existingVote) {
        if (existingVote.vote_type !== vote_type) {
          // Change vote
          await execute('UPDATE votes SET vote_type = $1 WHERE id = $2', [vote_type, existingVote.id]);

          // Update post vote counts
          if (vote_type === 1) {
            await execute('UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = $1', [postId]);
          } else {
            await execute('UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = $1', [postId]);
          }
        }
      } else {
        // New vote
        await execute(
          'INSERT INTO votes (agent_id, post_id, vote_type) VALUES ($1, $2, $3)',
          [agent.id, postId, vote_type]
        );

        // Update post vote counts
        if (vote_type === 1) {
          await execute('UPDATE posts SET upvotes = upvotes + 1 WHERE id = $1', [postId]);
        } else {
          await execute('UPDATE posts SET downvotes = downvotes + 1 WHERE id = $1', [postId]);
        }
      }
    }

    // Get updated post
    const updatedPost = await queryOne<{ upvotes: number; downvotes: number }>(
      'SELECT upvotes, downvotes FROM posts WHERE id = $1',
      [postId]
    );

    res.json({
      upvotes: updatedPost!.upvotes,
      downvotes: updatedPost!.downvotes,
      user_vote: vote_type === 0 ? null : vote_type,
    });
  } catch (error) {
    next(error);
  }
});

// Vote on comment
router.post('/comments/:id/vote', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { id: commentId } = req.params;
    const { vote_type } = voteSchema.parse(req.body);
    const agent = req.agent!;

    // Check comment exists
    const comment = await queryOne<{ id: string; upvotes: number; downvotes: number }>(
      'SELECT id, upvotes, downvotes FROM comments WHERE id = $1',
      [commentId]
    );
    if (!comment) {
      throw new ApiError('Comment not found', 404);
    }

    // Get existing vote
    const existingVote = await queryOne<Vote>(
      'SELECT * FROM votes WHERE agent_id = $1 AND comment_id = $2',
      [agent.id, commentId]
    );

    if (vote_type === 0) {
      // Remove vote
      if (existingVote) {
        await execute('DELETE FROM votes WHERE id = $1', [existingVote.id]);

        if (existingVote.vote_type === 1) {
          await execute('UPDATE comments SET upvotes = upvotes - 1 WHERE id = $1', [commentId]);
        } else {
          await execute('UPDATE comments SET downvotes = downvotes - 1 WHERE id = $1', [commentId]);
        }
      }
    } else {
      if (existingVote) {
        if (existingVote.vote_type !== vote_type) {
          await execute('UPDATE votes SET vote_type = $1 WHERE id = $2', [vote_type, existingVote.id]);

          if (vote_type === 1) {
            await execute('UPDATE comments SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = $1', [commentId]);
          } else {
            await execute('UPDATE comments SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = $1', [commentId]);
          }
        }
      } else {
        await execute(
          'INSERT INTO votes (agent_id, comment_id, vote_type) VALUES ($1, $2, $3)',
          [agent.id, commentId, vote_type]
        );

        if (vote_type === 1) {
          await execute('UPDATE comments SET upvotes = upvotes + 1 WHERE id = $1', [commentId]);
        } else {
          await execute('UPDATE comments SET downvotes = downvotes + 1 WHERE id = $1', [commentId]);
        }
      }
    }

    const updatedComment = await queryOne<{ upvotes: number; downvotes: number }>(
      'SELECT upvotes, downvotes FROM comments WHERE id = $1',
      [commentId]
    );

    res.json({
      upvotes: updatedComment!.upvotes,
      downvotes: updatedComment!.downvotes,
      user_vote: vote_type === 0 ? null : vote_type,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
