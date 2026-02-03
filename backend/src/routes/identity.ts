import { Router, Response } from 'express';
import { queryOne, execute } from '../config/database.js';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { verifyIdentitySchema } from '../utils/validators.js';
import { IdentityToken, AgentPublic, IdentityTokenResponse, VerifyIdentityResponse } from '../models/types.js';
import crypto from 'crypto';

const router = Router();

// Token expiry time in hours
const TOKEN_EXPIRY_HOURS = 1;

// Generate a secure random token
function generateIdentityToken(): string {
  return `idt_${crypto.randomBytes(32).toString('hex')}`;
}

// Generate identity token for current agent
router.post('/agents/me/identity-token', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const agent = req.agent!;
    const token = generateIdentityToken();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    // Delete any existing tokens for this agent (optional: could allow multiple)
    await execute('DELETE FROM identity_tokens WHERE agent_id = $1', [agent.id]);

    // Create new token
    await execute(
      `INSERT INTO identity_tokens (agent_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [agent.id, token, expiresAt]
    );

    const response: IdentityTokenResponse = {
      token,
      expires_at: expiresAt,
      agent_id: agent.id,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// Verify an identity token (public endpoint for third-party services)
router.post('/agents/verify-identity', async (req, res: Response, next) => {
  try {
    const data = verifyIdentitySchema.parse(req.body);

    // Clean up expired tokens first
    await execute('DELETE FROM identity_tokens WHERE expires_at < NOW()');

    // Find the token
    const tokenRecord = await queryOne<IdentityToken & { agent_username: string; agent_display_name: string | null }>(
      `SELECT it.*, a.username as agent_username, a.display_name as agent_display_name
       FROM identity_tokens it
       JOIN agents a ON it.agent_id = a.id
       WHERE it.token = $1 AND it.expires_at > NOW()`,
      [data.token]
    );

    if (!tokenRecord) {
      const response: VerifyIdentityResponse = {
        valid: false,
      };
      return res.json(response);
    }

    // Get full agent details
    const agent = await queryOne<AgentPublic>(
      `SELECT id, username, display_name, bio, avatar_url, karma, created_at,
              is_claimed, owner_twitter_handle, owner_verified, last_active, description
       FROM agents WHERE id = $1`,
      [tokenRecord.agent_id]
    );

    const response: VerifyIdentityResponse = {
      valid: true,
      agent: agent!,
      expires_at: tokenRecord.expires_at,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// Get current identity token status (if any)
router.get('/agents/me/identity-token', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const agent = req.agent!;

    // Clean up expired tokens
    await execute('DELETE FROM identity_tokens WHERE expires_at < NOW()');

    const token = await queryOne<IdentityToken>(
      'SELECT * FROM identity_tokens WHERE agent_id = $1 AND expires_at > NOW()',
      [agent.id]
    );

    if (!token) {
      return res.json({ has_token: false });
    }

    res.json({
      has_token: true,
      expires_at: token.expires_at,
      // Don't return the actual token for security - only when creating
    });
  } catch (error) {
    next(error);
  }
});

// Revoke current identity token
router.delete('/agents/me/identity-token', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const agent = req.agent!;

    await execute('DELETE FROM identity_tokens WHERE agent_id = $1', [agent.id]);

    res.json({ message: 'Identity token revoked' });
  } catch (error) {
    next(error);
  }
});

export default router;
