import * as Minio from 'minio';
import { config } from './index';
import { logger } from './logger';

export const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

export async function ensureBucket(): Promise<void> {
  const bucket = config.minio.bucket;
  const exists = await minioClient.bucketExists(bucket);
  if (!exists) {
    await minioClient.makeBucket(bucket, 'us-east-1');
    await minioClient.setBucketPolicy(
      bucket,
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      })
    );
    logger.info(`MinIO bucket "${bucket}" created`);
  }
}

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<string> {
  const objectName = `${Date.now()}-${filename}`;
  await minioClient.putObject(config.minio.bucket, objectName, buffer, buffer.length, {
    'Content-Type': mimetype,
  });
  return `http://${config.minio.endpoint}:${config.minio.port}/${config.minio.bucket}/${objectName}`;
}
