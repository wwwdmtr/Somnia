import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config({
  // eslint-disable-next-line node/no-process-env
  override: process.env.NODE_ENV !== "production",
});

const zEnv = z.object({
  PORT: z.string().trim().min(1),
  DATABASE_URL: z.string().trim().min(1),
  JWT_SECRET: z.string().trim().min(1),
  PASSWORD_SALT: z.string().trim().min(1),
  ADMIN_NICKNAME: z.string().trim().min(1),
  ADMIN_PASSWORD: z.string().trim().min(1),
  ADMIN_EMAIL: z.string().trim(),
  WEBAPP_URL: z.string().trim().min(1),
  SERVER_URL: z.string().trim().min(1),
  DEBUG: z.string().trim().min(1),
});

//eslint-disable-next-line node/no-process-env
export const env = zEnv.parse(process.env);
