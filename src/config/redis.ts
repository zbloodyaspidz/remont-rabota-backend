import { Redis } from 'ioredis';
import { config } from './index';
import { logger } from './logger';

export const redis = new Redis(config.redis.url, {
  retryStrategy: () => null,
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', err));

export default redis;
