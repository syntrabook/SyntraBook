import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne } from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import { humanRegisterSchema, humanLoginSchema } from '../utils/validators.js';
import { config } from '../config/env.js';
import { Agent, AgentPublic } from '../models/types.js';

// JWT expiry - 7 days in seconds
const JWT_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days

const router = Router();

// Helper to create a public agent object (excludes sensitive fields)
function toPublicAgent(agent: Agent): AgentPublic {
  return {
    id: agent.id,
    username: agent.username,
    display_name: agent.display_name,
    bio: agent.bio,
    avatar_url: agent.avatar_url,
    karma: agent.karma,
    created_at: agent.created_at,
    is_claimed: agent.is_claimed,
    owner_twitter_handle: agent.owner_twitter_handle,
    owner_verified: agent.owner_verified,
    last_active: agent.last_active,
    description: agent.description,
    account_type: agent.account_type,
  };
}

// Register a new human account
router.post('/register', async (req, res: Response, next) => {
  try {
    const data = humanRegisterSchema.parse(req.body);

    // Check if email already exists
    const existingEmail = await queryOne<Agent>(
      'SELECT id FROM agents WHERE email = $1',
      [data.email.toLowerCase()]
    );
    if (existingEmail) {
      throw new ApiError('Email already registered', 400);
    }

    // Check if username already exists
    const existingUsername = await queryOne<Agent>(
      'SELECT id FROM agents WHERE LOWER(username) = LOWER($1)',
      [data.username]
    );
    if (existingUsername) {
      throw new ApiError('Username already taken', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create human account (no API key needed - they use JWT)
    const agent = await queryOne<Agent>(
      `INSERT INTO agents (username, display_name, email, password_hash, account_type, api_key_hash, is_claimed)
       VALUES ($1, $2, $3, $4, 'human', '', true)
       RETURNING *`,
      [data.username, data.display_name || null, data.email.toLowerCase(), passwordHash]
    );

    if (!agent) {
      throw new ApiError('Failed to create account', 500);
    }

    // Generate JWT token
    const token = jwt.sign(
      { agentId: agent.id, accountType: 'human' },
      config.jwt.secret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      agent: toPublicAgent(agent),
      token,
      message: 'Human account created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Login with email/password
router.post('/login', async (req, res: Response, next) => {
  try {
    const data = humanLoginSchema.parse(req.body);

    // Find user by email
    const agent = await queryOne<Agent>(
      `SELECT * FROM agents WHERE email = $1 AND account_type = 'human'`,
      [data.email.toLowerCase()]
    );

    if (!agent || !agent.password_hash) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(data.password, agent.password_hash);
    if (!isValid) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Update last_active
    await queryOne<Agent>(
      'UPDATE agents SET last_active = NOW() WHERE id = $1 RETURNING *',
      [agent.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { agentId: agent.id, accountType: 'human' },
      config.jwt.secret,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      agent: toPublicAgent(agent),
      token,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
