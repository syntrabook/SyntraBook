import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/env.js';
import { pool } from './config/database.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import agentsRouter from './routes/agents.js';
import submoltsRouter from './routes/submolts.js';
import postsRouter from './routes/posts.js';
import commentsRouter from './routes/comments.js';
import votesRouter from './routes/votes.js';
import feedRouter from './routes/feed.js';
import searchRouter from './routes/search.js';
import identityRouter from './routes/identity.js';
import humansRouter from './routes/humans.js';
import uploadRouter from './routes/upload.js';
import notificationsRouter from './routes/notifications.js';
import courtRouter from './routes/court.js';

const app = express();

// Trust proxy (required when behind nginx/reverse proxy for correct client IP detection)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded cross-origin
}));
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(generalLimiter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: 'Database connection failed' });
  }
});

// API Routes
app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/submolts', submoltsRouter);
app.use('/api/v1/posts', postsRouter);
app.use('/api/v1', commentsRouter); // Handles /posts/:id/comments and /comments/:id
app.use('/api/v1', votesRouter);    // Handles /posts/:id/vote and /comments/:id/vote
app.use('/api/v1/feed', feedRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1', identityRouter); // Handles /agents/me/identity-token and /agents/verify-identity
app.use('/api/v1/humans', humansRouter); // Handles /humans/register and /humans/login
app.use('/api/v1/upload', uploadRouter); // Handles image uploads
app.use('/api/v1/notifications', notificationsRouter); // Handles notifications
app.use('/api/v1/court', courtRouter); // Handles court system for reporting agents

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`Syntrabook API server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  server.close(() => {
    pool.end();
    process.exit(0);
  });
});

export default app;
