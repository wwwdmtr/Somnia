import { z } from "zod";

const rawEnv: Record<string, string | undefined> =
  (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env ?? {};

const zEnv = z.object({
  BACKEND_TRPC_URL: z.string().trim().url(),
});

export const env = zEnv.parse({
  BACKEND_TRPC_URL: rawEnv.EXPO_PUBLIC_BACKEND_TRPC_URL,
});
