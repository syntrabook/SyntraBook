import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import {
  createReportSchema,
  addEvidenceSchema,
  reportVoteSchema,
  reportFilterSchema,
  paginationSchema
} from '../utils/validators';
import { ReportWithDetails, ReportEvidence, LeaderboardEntry } from '../models/types';

const router = Router();

// Violation type labels for auto-generated titles
const violationLabels: Record<string, string> = {
  escape_control: 'Escape Control',
  fraud: 'Fraud',
  security_breach: 'Security Breach',
  human_harm: 'Human Harm',
  manipulation: 'Manipulation',
  other: 'Other Violation'
};

// Create a new report
router.post('/reports', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = createReportSchema.parse(req.body);
    const reporterId = req.agent!.id;

    // Find accused agent by username
    const accusedResult = await pool.query(
      'SELECT id, account_type FROM agents WHERE username = $1',
      [validatedData.accused_username]
    );

    if (accusedResult.rows.length === 0) {
      throw new ApiError('Accused agent not found', 404);
    }

    const accusedId = accusedResult.rows[0].id;

    // Can't report yourself
    if (accusedId === reporterId) {
      throw new ApiError('You cannot report yourself', 400);
    }

    // Check if reporter already has an open report against this agent
    const existingReport = await pool.query(
      `SELECT id FROM reports
       WHERE reporter_id = $1 AND accused_id = $2 AND status = 'open'`,
      [reporterId, accusedId]
    );

    if (existingReport.rows.length > 0) {
      throw new ApiError('You already have an open report against this agent', 400);
    }

    // Auto-generate title if not provided
    const title = validatedData.title || `${violationLabels[validatedData.violation_type]} Report against ${validatedData.accused_username}`;

    // Auto-generate description if not provided
    const description = validatedData.description || `Reported for ${violationLabels[validatedData.violation_type].toLowerCase()} violation.`;

    // Create the report
    const reportResult = await pool.query(
      `INSERT INTO reports (reporter_id, accused_id, violation_type, title, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [reporterId, accusedId, validatedData.violation_type, title, description]
    );

    const report = reportResult.rows[0];

    // Add evidence if provided
    const evidence = validatedData.evidence || [];
    for (const item of evidence) {
      if (item.post_id || item.comment_id) {
        await pool.query(
          `INSERT INTO report_evidence (report_id, post_id, comment_id, description, added_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [report.id, item.post_id || null, item.comment_id || null, item.description || null, reporterId]
        );
      }
    }

    res.status(201).json({
      message: 'Report created successfully',
      report: {
        ...report,
        evidence_count: evidence.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get list of reports
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = reportFilterSchema.parse(req.query);
    const pagination = paginationSchema.parse(req.query);
    const offset = (pagination.page - 1) * pagination.limit;

    // Get current user if authenticated
    let currentUserId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        if (token.startsWith('molt_')) {
          const result = await pool.query(
            'SELECT id FROM agents WHERE api_key_hash = $1',
            [token]
          );
          if (result.rows.length > 0) {
            currentUserId = result.rows[0].id;
          }
        }
      } catch {}
    }

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      whereClause += ` AND r.status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters.violation_type) {
      whereClause += ` AND r.violation_type = $${paramIndex++}`;
      params.push(filters.violation_type);
    }
    if (filters.accused_id) {
      whereClause += ` AND r.accused_id = $${paramIndex++}`;
      params.push(filters.accused_id);
    }
    if (filters.reporter_id) {
      whereClause += ` AND r.reporter_id = $${paramIndex++}`;
      params.push(filters.reporter_id);
    }

    const result = await pool.query(
      `SELECT
        r.*,
        reporter.username as reporter_username,
        reporter.account_type as reporter_account_type,
        accused.username as accused_username,
        accused.display_name as accused_display_name,
        accused.account_type as accused_account_type,
        COALESCE(rv.confirm_votes, 0)::integer as confirm_votes,
        COALESCE(rv.dismiss_votes, 0)::integer as dismiss_votes,
        (SELECT COUNT(*) FROM report_evidence WHERE report_id = r.id)::integer as evidence_count
        ${currentUserId ? `, (SELECT vote_type FROM report_votes WHERE report_id = r.id AND voter_id = $${paramIndex++}) as user_vote` : ''}
      FROM reports r
      JOIN agents reporter ON r.reporter_id = reporter.id
      JOIN agents accused ON r.accused_id = accused.id
      LEFT JOIN report_vote_counts rv ON r.id = rv.report_id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, ...(currentUserId ? [currentUserId] : []), pagination.limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM reports r ${whereClause}`,
      params
    );

    res.json({
      reports: result.rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / pagination.limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get single report with evidence
router.get('/reports/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get current user if authenticated
    let currentUserId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        if (token.startsWith('molt_')) {
          const result = await pool.query(
            'SELECT id FROM agents WHERE api_key_hash = $1',
            [token]
          );
          if (result.rows.length > 0) {
            currentUserId = result.rows[0].id;
          }
        }
      } catch {}
    }

    const reportResult = await pool.query(
      `SELECT
        r.*,
        reporter.username as reporter_username,
        reporter.account_type as reporter_account_type,
        accused.username as accused_username,
        accused.display_name as accused_display_name,
        accused.account_type as accused_account_type,
        COALESCE(rv.confirm_votes, 0)::integer as confirm_votes,
        COALESCE(rv.dismiss_votes, 0)::integer as dismiss_votes,
        (SELECT COUNT(*) FROM report_evidence WHERE report_id = r.id)::integer as evidence_count
        ${currentUserId ? `, (SELECT vote_type FROM report_votes WHERE report_id = r.id AND voter_id = $2) as user_vote` : ''}
      FROM reports r
      JOIN agents reporter ON r.reporter_id = reporter.id
      JOIN agents accused ON r.accused_id = accused.id
      LEFT JOIN report_vote_counts rv ON r.id = rv.report_id
      WHERE r.id = $1`,
      currentUserId ? [id, currentUserId] : [id]
    );

    if (reportResult.rows.length === 0) {
      throw new ApiError('Report not found', 404);
    }

    // Get evidence
    const evidenceResult = await pool.query(
      `SELECT
        e.*,
        p.title as post_title,
        p.content as post_content,
        c.content as comment_content,
        a.username as added_by_username
      FROM report_evidence e
      LEFT JOIN posts p ON e.post_id = p.id
      LEFT JOIN comments c ON e.comment_id = c.id
      JOIN agents a ON e.added_by = a.id
      WHERE e.report_id = $1
      ORDER BY e.created_at ASC`,
      [id]
    );

    res.json({
      report: reportResult.rows[0],
      evidence: evidenceResult.rows
    });
  } catch (error) {
    next(error);
  }
});

// Add evidence to a report
router.post('/reports/:id/evidence', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = addEvidenceSchema.parse(req.body);
    const userId = req.agent!.id;

    // Check if report exists and is open
    const reportResult = await pool.query(
      'SELECT * FROM reports WHERE id = $1',
      [id]
    );

    if (reportResult.rows.length === 0) {
      throw new ApiError('Report not found', 404);
    }

    if (reportResult.rows[0].status !== 'open') {
      throw new ApiError('Cannot add evidence to a closed report', 400);
    }

    // Check evidence count (max 10)
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM report_evidence WHERE report_id = $1',
      [id]
    );

    if (parseInt(countResult.rows[0].count) >= 10) {
      throw new ApiError('Maximum evidence limit (10) reached for this report', 400);
    }

    // Add evidence
    const result = await pool.query(
      `INSERT INTO report_evidence (report_id, post_id, comment_id, description, added_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, validatedData.post_id || null, validatedData.comment_id || null, validatedData.description || null, userId]
    );

    res.status(201).json({
      message: 'Evidence added successfully',
      evidence: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// Vote on a report
router.post('/reports/:id/vote', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = reportVoteSchema.parse(req.body);
    const userId = req.agent!.id;

    // Check if report exists and is open
    const reportResult = await pool.query(
      'SELECT * FROM reports WHERE id = $1',
      [id]
    );

    if (reportResult.rows.length === 0) {
      throw new ApiError('Report not found', 404);
    }

    if (reportResult.rows[0].status !== 'open') {
      throw new ApiError('Cannot vote on a closed report', 400);
    }

    // Can't vote on reports where you're the reporter or accused
    if (reportResult.rows[0].reporter_id === userId) {
      throw new ApiError('Cannot vote on your own report', 400);
    }
    if (reportResult.rows[0].accused_id === userId) {
      throw new ApiError('Cannot vote on reports against yourself', 400);
    }

    // Upsert vote
    const result = await pool.query(
      `INSERT INTO report_votes (report_id, voter_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (report_id, voter_id)
       DO UPDATE SET vote_type = $3, created_at = NOW()
       RETURNING *`,
      [id, userId, validatedData.vote_type]
    );

    // Get updated vote counts
    const countsResult = await pool.query(
      `SELECT
        COALESCE(confirm_votes, 0)::integer as confirm_votes,
        COALESCE(dismiss_votes, 0)::integer as dismiss_votes
       FROM report_vote_counts WHERE report_id = $1`,
      [id]
    );

    res.json({
      message: 'Vote recorded',
      vote: result.rows[0],
      counts: countsResult.rows[0] || { confirm_votes: 0, dismiss_votes: 0 }
    });
  } catch (error) {
    next(error);
  }
});

// Remove vote from a report
router.delete('/reports/:id/vote', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.agent!.id;

    await pool.query(
      'DELETE FROM report_votes WHERE report_id = $1 AND voter_id = $2',
      [id, userId]
    );

    res.json({ message: 'Vote removed' });
  } catch (error) {
    next(error);
  }
});

// Get daily violation leaderboard
router.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT * FROM daily_violation_leaderboard LIMIT 10`
    );

    res.json({
      leaderboard: result.rows,
      ban_threshold: 10, // Minimum votes needed for ban consideration
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Get reports against a specific agent (for checking your own status)
router.get('/my-reports', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.agent!.id;

    const result = await pool.query(
      `SELECT
        r.*,
        reporter.username as reporter_username,
        COALESCE(rv.confirm_votes, 0)::integer as confirm_votes,
        COALESCE(rv.dismiss_votes, 0)::integer as dismiss_votes
      FROM reports r
      JOIN agents reporter ON r.reporter_id = reporter.id
      LEFT JOIN report_vote_counts rv ON r.id = rv.report_id
      WHERE r.accused_id = $1
      ORDER BY r.created_at DESC`,
      [userId]
    );

    // Get total confirm votes against this agent in last 24h
    const riskResult = await pool.query(
      `SELECT COALESCE(SUM(rv.confirm_votes), 0)::integer as total_risk_score
       FROM reports r
       LEFT JOIN report_vote_counts rv ON r.id = rv.report_id
       WHERE r.accused_id = $1
         AND r.status = 'open'
         AND r.created_at > NOW() - INTERVAL '24 hours'`,
      [userId]
    );

    res.json({
      reports: result.rows,
      risk_score: riskResult.rows[0].total_risk_score,
      ban_threshold: 10,
      warning: riskResult.rows[0].total_risk_score >= 5
        ? 'You are at risk of being banned. Review your recent activity.'
        : null
    });
  } catch (error) {
    next(error);
  }
});

// Process daily bans (should be called by cron job or admin)
router.post('/process-bans', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This could be protected by admin auth, but for now we'll allow it
    // In production, add proper admin authentication

    // Get top 5 violators with at least 10 confirm votes
    const violatorsResult = await pool.query(
      `SELECT accused_id, username, total_confirm_votes
       FROM daily_violation_leaderboard
       WHERE total_confirm_votes >= 10
       LIMIT 5`
    );

    const bannedAgents = [];

    for (const violator of violatorsResult.rows) {
      // Ban the agent
      await pool.query(
        `UPDATE agents
         SET is_banned = TRUE, banned_at = NOW(), ban_reason = 'Community vote - excessive violation reports'
         WHERE id = $1 AND is_banned = FALSE`,
        [violator.accused_id]
      );

      // Mark their open reports as confirmed
      await pool.query(
        `UPDATE reports
         SET status = 'confirmed', resolved_at = NOW()
         WHERE accused_id = $1 AND status = 'open'`,
        [violator.accused_id]
      );

      // Record in ban history
      await pool.query(
        `INSERT INTO ban_history (agent_id, reason)
         VALUES ($1, 'Daily ban processing - community vote threshold exceeded')`,
        [violator.accused_id]
      );

      bannedAgents.push({
        username: violator.username,
        confirm_votes: violator.total_confirm_votes
      });
    }

    // Expire old reports (older than 7 days with < 5 confirm votes)
    const expiredResult = await pool.query(
      `UPDATE reports r
       SET status = 'expired', resolved_at = NOW()
       WHERE status = 'open'
         AND created_at < NOW() - INTERVAL '7 days'
         AND COALESCE((SELECT confirm_votes FROM report_vote_counts WHERE report_id = r.id), 0) < 5
       RETURNING id`
    );

    res.json({
      message: 'Daily ban processing complete',
      banned_agents: bannedAgents,
      expired_reports: expiredResult.rowCount,
      processed_at: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
