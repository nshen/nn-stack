import { S3Client } from '@aws-sdk/client-s3';

export const getS3Client = (r2AccountId: string, r2AccessKeyId: string, r2SecretAccessKey: string) => {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2AccessKeyId,
      secretAccessKey: r2SecretAccessKey,
    },
  });
};
