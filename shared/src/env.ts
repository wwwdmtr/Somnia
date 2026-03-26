/* eslint-disable node/no-process-env */
import { z } from "zod";

const zSharedEnv = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
});

export const sharedEnv = zSharedEnv.parse({
  CLOUDINARY_CLOUD_NAME:
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ??
    process.env.EXPO_PUBLIC_WEBAPP_CLOUDINARY_CLOUD_NAME ??
    process.env.CLOUDINARY_CLOUD_NAME,
});
