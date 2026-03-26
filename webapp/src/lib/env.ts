/* eslint-disable node/no-process-env */
import { z } from 'zod';

const zEnv = z.object({
  BACKEND_TRPC_URL: z.string().trim().url(),
  WEBAPP_URL: z.string().trim().url(),
  SENTRYHAWK_DSN: z.string().trim(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CLOUDINARY_CLOUD_NAME: z.string().trim(),
  MIXPANEL_API_KEY: z.string().trim(),
  MIXPANEL_API_HOST: z.string().trim().url().default('https://api-js.mixpanel.com'),
});

export const env = zEnv.parse({
  BACKEND_TRPC_URL: process.env.EXPO_PUBLIC_BACKEND_TRPC_URL,
  WEBAPP_URL:
    process.env.EXPO_PUBLIC_WEBAPP_URL ??
    (typeof window !== 'undefined' ? window.location?.origin : undefined) ??
    'http://localhost:8081',
  SENTRYHAWK_DSN:
    process.env.EXPO_PUBLIC_SENTRYHAWK_DSN ??
    process.env.EXPO_PUBLIC_WEBAPP_SENTRYHAWK_DSN,
  NODE_ENV: process.env.NODE_ENV,
  CLOUDINARY_CLOUD_NAME:
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ??
    process.env.EXPO_PUBLIC_WEBAPP_CLOUDINARY_CLOUD_NAME,
  MIXPANEL_API_KEY:
    process.env.EXPO_PUBLIC_MIXPANEL_API_KEY ??
    process.env.EXPO_PUBLIC_WEBAPP_MIXPANEL_API_KEY,
  MIXPANEL_API_HOST:
    process.env.EXPO_PUBLIC_MIXPANEL_API_HOST ?? 'https://api-js.mixpanel.com',
});
