import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { setupChatSocket } from './sockets/chat.socket';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import orderRoutes from './routes/order.routes';
import categoryRoutes from './routes/category.routes';
import reviewRoutes from './routes/review.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';

async function bootstrap() {
  // Redis — optional
  let redisClient: import('./config/redis').default | null = null;
  try {
    const { redis } = await import('./config/redis');
    await redis.connect();
    redisClient = redis;
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis not available, running without cache/queues', { err });
  }

  // MinIO — optional
  try {
    const { ensureBucket } = await import('./config/minio');
    await ensureBucket();
    logger.info('MinIO bucket ready');
  } catch (err) {
    logger.warn('MinIO not available, file uploads disabled', { err });
  }

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: config.cors.origins, credentials: true },
    transports: ['websocket', 'polling'],
  });

  // Socket.io Redis adapter — optional
  if (redisClient) {
    try {
      const { createAdapter } = await import('@socket.io/redis-adapter');
      const pubClient = redisClient.duplicate();
      const subClient = redisClient.duplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.io Redis adapter initialized');
    } catch (err) {
      logger.warn('Socket.io Redis adapter not available', { err });
    }
  }

  setupChatSocket(io);

  app.use(
    cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    })
  );
  app.use(helmet());
  app.use(compression());
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.max }));

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/orders', orderRoutes);
  app.use('/categories', categoryRoutes);
  app.use('/notifications', notificationRoutes);
  app.use('/admin', adminRoutes);
  app.use('/', reviewRoutes);

  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

  app.use(errorHandler);

  // Background jobs — optional (require Redis)
  if (redisClient) {
    try {
      const { startOrderSearchWorker } = await import('./jobs/orderSearch.job');
      const { scheduleRatingUpdate } = await import('./jobs/ratingUpdate.job');
      await startOrderSearchWorker();
      await scheduleRatingUpdate();
      logger.info('Background jobs started');
    } catch (err) {
      logger.warn('Background jobs not started', { err });
    }
  }

  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
