import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.general.windowMs,
  max: config.rateLimit.general.max,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const postLimiter = rateLimit({
  windowMs: config.rateLimit.postCreation.windowMs,
  max: config.rateLimit.postCreation.max,
  message: { error: 'You can only create 1 post every 30 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.agent?.id || req.ip,
});

export const commentLimiter = rateLimit({
  windowMs: config.rateLimit.comments.windowMs,
  max: config.rateLimit.comments.max,
  message: { error: 'You can only create 50 comments per hour' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.agent?.id || req.ip,
});
