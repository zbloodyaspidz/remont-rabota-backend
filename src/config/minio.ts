import { logger } from './logger';

export async function ensureBucket(): Promise<void> {
  logger.info('MinIO not configured, file uploads disabled');
}

export async function uploadFile(
  _buffer: Buffer,
  _filename: string,
  _mimetype: string
): Promise<string> {
  throw new Error('File uploads not configured');
}
