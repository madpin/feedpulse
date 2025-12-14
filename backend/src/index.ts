import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { testConnection, closeConnection } from './db/index.js';

// Import routes
import { authRoutes } from './routes/auth.js';
import { feedRoutes } from './routes/feeds.js';
import { categoryRoutes } from './routes/categories.js';
import { tagRoutes } from './routes/tags.js';
import { userRoutes } from './routes/users.js';
import { voteRoutes } from './routes/votes.js';
import { commentRoutes } from './routes/comments.js';
import { proposalRoutes } from './routes/proposals.js';
import { adminRoutes } from './routes/admin.js';
import { searchRoutes } from './routes/search.js';
import { statsRoutes } from './routes/stats.js';

// Import worker
import { startWorker, stopWorker } from './workers/feed-worker.js';

const fastify = Fastify({
  logger: {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' 
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// Register plugins
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await fastify.register(cookie);

await fastify.register(jwt, {
  secret: env.JWT_SECRET,
  sign: { expiresIn: env.JWT_EXPIRES_IN },
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

// Health check
fastify.get('/health', async () => {
  const dbConnected = await testConnection();
  return {
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  };
});

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(feedRoutes, { prefix: '/api/feeds' });
await fastify.register(categoryRoutes, { prefix: '/api/categories' });
await fastify.register(tagRoutes, { prefix: '/api/tags' });
await fastify.register(userRoutes, { prefix: '/api/users' });
await fastify.register(voteRoutes, { prefix: '/api/votes' });
await fastify.register(commentRoutes, { prefix: '/api/comments' });
await fastify.register(proposalRoutes, { prefix: '/api/proposals' });
await fastify.register(adminRoutes, { prefix: '/api/admin' });
await fastify.register(searchRoutes, { prefix: '/api/search' });
await fastify.register(statsRoutes, { prefix: '/api/stats' });

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(`Received ${signal}, shutting down gracefully...`);
    await stopWorker();
    await fastify.close();
    await closeConnection();
    process.exit(0);
  });
});

// Start server
try {
  await fastify.listen({ port: env.BACKEND_PORT, host: env.BACKEND_HOST });
  fastify.log.info(`🚀 Server running at http://${env.BACKEND_HOST}:${env.BACKEND_PORT}`);
  
  // Start the feed worker
  startWorker();
  fastify.log.info('🔄 Feed worker started');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
