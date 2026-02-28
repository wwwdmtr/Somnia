import { z } from "zod";

const zEnv = z.object({
  BACKEND_TRPC_URL: z.string().trim().url(),
  WEBAPP_URL: z.string().trim().url(),
});

export const env = zEnv.parse({
  // eslint-disable-next-line node/no-process-env
  BACKEND_TRPC_URL: process.env.EXPO_PUBLIC_BACKEND_TRPC_URL,
  WEBAPP_URL:
    // eslint-disable-next-line node/no-process-env
    process.env.EXPO_PUBLIC_WEBAPP_URL ??
    (typeof window !== "undefined" ? window.location?.origin : undefined) ??
    "http://localhost:8081",
});
