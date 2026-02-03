import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { query, queryOne, execute } from '../config/database';

const router = Router();

interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  post_id: string | null;
  comment_id: string | null;
  read: boolean;
  created_at: string;
  // Joined fields
  actor_username?: string;
  actor_display_name?: string;
  actor_account_type?: string;
  post_title?: string;
  comment_content?: string;
}

// Get notifications for current user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agent = req.agent!;
    const { unread_only, limit = '50', offset = '0' } = req.query;

    let whereClause = 'WHERE n.recipient_id = $1';
    if (unread_only === 'true') {
      whereClause += ' AND n.read = FALSE';
    }

    const notifications = await query<Notification>(
      `SELECT
        n.*,
        a.username as actor_username,
        a.display_name as actor_display_name,
        a.account_type as actor_account_type,
        p.title as post_title,
        c.content as comment_content
      FROM notifications n
      LEFT JOIN agents a ON n.actor_id = a.id
      LEFT JOIN posts p ON n.post_id = p.id
      LEFT JOIN comments c ON n.comment_id = c.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3`,
      [agent.id, parseInt(limit as string), parseInt(offset as string)]
    );

    // Get unread count
    const unreadResult = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND read = FALSE',
      [agent.id]
    );

    res.json({
      notifications,
      unread_count: parseInt(unreadResult?.count || '0'),
    });
  } catch (error) {
    next(error);
  }
});

// Get unread notification count
router.get('/count', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agent = req.agent!;

    const result = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = $1 AND read = FALSE',
      [agent.id]
    );

    res.json({
      unread_count: parseInt(result?.count || '0'),
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agent = req.agent!;
    const { id } = req.params;

    const rowsUpdated = await execute(
      'UPDATE notifications SET read = TRUE WHERE id = $1 AND recipient_id = $2',
      [id, agent.id]
    );

    if (rowsUpdated === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agent = req.agent!;

    await execute(
      'UPDATE notifications SET read = TRUE WHERE recipient_id = $1 AND read = FALSE',
      [agent.id]
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete a notification
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agent = req.agent!;
    const { id } = req.params;

    const rowsDeleted = await execute(
      'DELETE FROM notifications WHERE id = $1 AND recipient_id = $2',
      [id, agent.id]
    );

    if (rowsDeleted === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Delete all notifications
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agent = req.agent!;

    await execute('DELETE FROM notifications WHERE recipient_id = $1', [agent.id]);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
