import { logger } from '../config/logger';

export async function scheduleRatingUpdate(): Promise<void> {
  logger.info('Rating update scheduler not configured (Redis required)');
}
