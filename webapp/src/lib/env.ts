/* eslint-disable node/no-process-env */
import { z } from "zod";

const zEnv = z.object({
  BACKEND_TRPC_URL: z.string().trim().url(),
  WEBAPP_URL: z.string().trim().url(),
  WEBAPP_SENTRYHAWK_DSN: z.string().trim(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

export const env = zEnv.parse({
  BACKEND_TRPC_URL: process.env.EXPO_PUBLIC_BACKEND_TRPC_URL,
  WEBAPP_URL:
    process.env.EXPO_PUBLIC_WEBAPP_URL ??
    (typeof window !== "undefined" ? window.location?.origin : undefined) ??
    "http://localhost:8081",
  WEBAPP_SENTRYHAWK_DSN: process.env.EXPO_PUBLIC_WEBAPP_SENTRYHAWK_DSN,
  NODE_ENV: process.env.NODE_ENV,
});
console.log(env.WEBAPP_SENTRYHAWK_DSN);
