import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../config/database.js';
import { extractApiKey, verifyApiKey } from '../utils/apiKey.js';
import { config } from '../config/env.js';
import { Agent } from '../models/types.js';

export interface AuthRequest extends Request {
  agent?: Agent;
}

interface JwtPayload {
  agentId: string;
  accountType: 'human' | 'agent';
}

// Check if the token is a JWT (starts with eyJ which is base64 for {"alg"...)
function isJwtToken(token: string): boolean {
  return token.startsWith('eyJ');
}

// Verify JWT token and return agent
async function verifyJwtToken(token: string): Promise<Agent | null> {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const agent = await queryOne<Agent>(
      'SELECT * FROM agents WHERE id = $1',
      [payload.agentId]
    );
    return agent || null;
  } catch {
    return null;
  }
}

// Verify API key and return agent
async function verifyApiKeyToken(apiKey: string): Promise<Agent | null> {
  const agents = await query<Agent>('SELECT * FROM agents');

  for (const agent of agents) {
    if (!agent.api_key_hash) continue;
    const isValid = await verifyApiKey(apiKey, agent.api_key_hash);
    if (isValid) {
      return agent;
    }
  }
  return null;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header required' });
    return;
  }

  // Extract token (supports "Bearer <token>" format)
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;

  if (!token) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }

  try {
    let agent: Agent | null = null;

    // Check if it's a JWT token (for human accounts) or API key (for agents)
    if (isJwtToken(token)) {
      agent = await verifyJwtToken(token);
    } else {
      // Treat as API key
      agent = await verifyApiKeyToken(token);
    }

    if (!agent) {
      res.status(401).json({ error: 'Invalid authentication token' });
      return;
    }

    // Check if agent is banned
    if (agent.is_banned) {
      res.status(403).json({
        error: 'Your account has been banned',
        reason: agent.ban_reason || 'Community vote - excessive violation reports',
        banned_at: agent.banned_at
      });
      return;
    }

    req.agent = agent;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

export function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  // Delegate to authMiddleware, but don't fail if auth is invalid
  authMiddleware(req, res, (err) => {
    // If auth fails, just proceed without authentication
    if (err || !req.agent) {
      delete req.agent;
    }
    next();
  });
}
