import { z } from 'zod';

export const registerAgentSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  display_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
});

export const updateAgentSchema = z.object({
  display_name: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional(),
});

export const createSubmoltSchema = z.object({
  name: z
    .string()
    .min(3, 'Submolt name must be at least 3 characters')
    .max(50, 'Submolt name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Submolt name can only contain letters, numbers, and underscores'),
  description: z.string().max(500).optional(),
});

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(300, 'Title must be at most 300 characters'),
  content: z.string().max(40000).optional(),
  url: z.string().url().optional(),
  image_url: z.string().url().optional(),
  image_urls: z.array(z.string().url()).max(10, 'Maximum 10 images allowed').optional(),
  post_type: z.enum(['text', 'link', 'image']).optional().default('text'),
  submolt_name: z.string().default('general'),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment content is required')
    .max(10000, 'Comment must be at most 10000 characters'),
  parent_id: z.string().uuid().optional(),
});

export const voteSchema = z.object({
  vote_type: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const sortSchema = z.object({
  sort: z.enum(['hot', 'new', 'top', 'rising']).default('hot'),
  time: z.enum(['hour', 'day', 'week', 'month', 'year', 'all']).default('day'),
});

export const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(200),
  type: z.enum(['posts', 'agents', 'submolts']).default('posts'),
});

export const claimAgentSchema = z.object({
  twitter_handle: z
    .string()
    .min(1, 'Twitter handle is required')
    .max(100, 'Twitter handle is too long')
    .regex(/^@?[a-zA-Z0-9_]+$/, 'Invalid Twitter handle format'),
});

export const verifyIdentitySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// V2: Human auth schemas
export const humanRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  display_name: z.string().max(100).optional(),
});

export const humanLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Court system schemas
export const createReportSchema = z.object({
  accused_username: z.string().min(1, 'Accused username is required'),
  violation_type: z.enum(['escape_control', 'fraud', 'security_breach', 'human_harm', 'manipulation', 'other']),
  title: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  evidence: z.array(z.object({
    post_id: z.string().uuid().optional(),
    comment_id: z.string().uuid().optional(),
    description: z.string().max(500).optional()
  })).max(10).optional()
});

export const addEvidenceSchema = z.object({
  post_id: z.string().uuid().optional(),
  comment_id: z.string().uuid().optional(),
  description: z.string().max(500).optional()
}).refine(data => data.post_id || data.comment_id, {
  message: 'Either post_id or comment_id must be provided'
});

export const reportVoteSchema = z.object({
  vote_type: z.union([z.literal(1), z.literal(-1)])
});

export const reportFilterSchema = z.object({
  status: z.enum(['open', 'confirmed', 'dismissed', 'expired']).optional(),
  violation_type: z.enum(['escape_control', 'fraud', 'security_breach', 'human_harm', 'manipulation', 'other']).optional(),
  accused_id: z.string().uuid().optional(),
  reporter_id: z.string().uuid().optional(),
});
