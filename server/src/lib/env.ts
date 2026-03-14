import fs from 'fs';
import path from 'path';

import * as dotenv from 'dotenv';
import { z } from 'zod';

const findEnvFilePath = (dir: string): string | null => {
  const maybeEnvFilePath = path.join(dir, '.env');
  if (fs.existsSync(maybeEnvFilePath)) {
    return maybeEnvFilePath;
  }

  const parentDir = path.dirname(dir);
  if (parentDir === dir) {
    return null;
  }
  return findEnvFilePath(parentDir);
};

const envFilePath = findEnvFilePath(__dirname);
if (envFilePath) {
  dotenv.config({ path: envFilePath, override: true, quiet: true });
  // eslint-disable-next-line node/no-process-env
  if (process.env.NODE_ENV) {
    dotenv.config({
      // eslint-disable-next-line node/no-process-env
      path: `${envFilePath}.${process.env.NODE_ENV}`,
      override: true,
      quiet: true,
    });
  }
}

const zEnv = z.object({
  PORT: z.string().trim().min(1),
  DATABASE_URL: z
    .string()
    .trim()
    .min(1)
    .refine((val) => {
      // eslint-disable-next-line node/no-process-env
      if (process.env.NODE_ENV !== 'test') {
        return true;
      }
      const [databaseUrl = ''] = val.split('?');
      const [databaseName = ''] = databaseUrl.split('/').reverse();
      return databaseName.endsWith('-test');
    }, 'Data base name should ends with "-test" on test environment'),
  JWT_SECRET: z.string().trim().min(1),
  PASSWORD_SALT: z.string().trim().min(1),
  ADMIN_NICKNAME: z.string().trim().min(1),
  ADMIN_PASSWORD: z.string().trim().min(1),
  ADMIN_EMAIL: z.string().trim(),
  WEBAPP_URL: z.string().trim().min(1),
  SERVER_URL: z.string().trim().min(1),
  DEBUG: z
    .string()
    .optional()
    .refine(
      (val) =>
        // eslint-disable-next-line node/no-process-env
        process.env.HOST_ENV === 'local' ||
        // eslint-disable-next-line node/no-process-env
        process.env.NODE_ENV !== 'production' ||
        (!!val && val.length > 0),
      'Required on not local host on production',
    ),
  BACKEND_SENTRYHAWK_DSN: z.string().trim().min(1),
  SOURCE_VERSION: z.string().trim().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

//eslint-disable-next-line node/no-process-env
export const env = zEnv.parse(process.env);
