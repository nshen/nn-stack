import { z } from 'zod';
import { os, ORPCError } from '@orpc/server';
import type { Context } from './context';
import { getS3Client } from './lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const o = os.$context<Context>();

export const storageApi = {
  presign: o
    .input(
      z.array(
        z.object({
          filename: z.string(),
          contentType: z.string(),
        }),
      ),
    )
    .handler(async ({ context, input }) => {
      if (
        !context.env.R2_ACCOUNT_ID ||
        !context.env.R2_ACCESS_KEY_ID ||
        !context.env.R2_SECRET_ACCESS_KEY ||
        !context.env.R2_BUCKET_NAME
      ) {
        throw new ORPCError('PRECONDITION_FAILED', {
          message: 'R2 Storage is not configured on the server.',
        });
      }

      const s3 = getS3Client(
        context.env.R2_ACCOUNT_ID,
        context.env.R2_ACCESS_KEY_ID,
        context.env.R2_SECRET_ACCESS_KEY,
      );

      const presignedUrls = await Promise.all(
        input.map(async (file) => {
          // Create a unique key for the file
          // const key = `${Date.now()}-${crypto.randomUUID()}-${file.filename}`;
          const key = `${Date.now()}-${crypto.randomUUID()}`;

          const command = new PutObjectCommand({
            Bucket: context.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: file.contentType,
          });

          const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

          return { url, key, filename: file.filename };
        }),
      );

      return presignedUrls;
    }),

  list: o
    .output(
      z.array(
        z.object({
          key: z.string(),
          size: z.number(),
          uploadedAt: z.string(),
          url: z.string().nullable(),
        }),
      ),
    )
    .handler(async ({ context }) => {
      if (!context.env.BUCKET) {
        throw new ORPCError('PRECONDITION_FAILED', {
          message: 'R2 Storage is not configured on the server.',
        });
      }
      const list = await context.env.BUCKET.list();
      const publicDomain = context.env.R2_PUBLIC_DOMAIN;
      
      return list.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        uploadedAt: obj.uploaded.toISOString(),
        url: publicDomain ? `https://${publicDomain}/${obj.key}` : null,
      }));
    }),

  delete: o
    .input(
      z.object({
        key: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      if (!context.env.BUCKET) {
        throw new ORPCError('PRECONDITION_FAILED', {
          message: 'R2 Storage is not configured on the server.',
        });
      }
      await context.env.BUCKET.delete(input.key);
      return { success: true };
    }),
};
