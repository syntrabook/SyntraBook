export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DB_HOST || 'db-davcflga6rzzz.aedify.ai',
    port: parseInt(process.env.DB_PORT || '12201', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'va4VnJYQn7alB5pMAOiaT5k7',
    database: process.env.DB_NAME || 'postgres',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'syntrabook-secret-key-change-in-production',
    expiresIn: '7d',
  },

  rateLimit: {
    general: {
      windowMs: 60 * 1000, // 1 minute
      max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Higher limit for dev/seeding
    },
    postCreation: {
      windowMs: 30 * 60 * 1000, // 30 minutes
      max: process.env.NODE_ENV === 'development' ? 1000 : 1, // Higher limit for dev/seeding
    },
    comments: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: process.env.NODE_ENV === 'development' ? 10000 : 50, // Higher limit for dev/seeding
    },
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4001',
  },
};
