import * as Sentry from "@sentry/node";

import { env } from "./env";
import { type LoggerMetaData } from "./logger";

if (env.BACKEND_SENTRYHAWK_DSN) {
  Sentry.init({
    dsn: env.BACKEND_SENTRYHAWK_DSN,
    environment: env.NODE_ENV,
    release: env.SOURCE_VERSION,
    normalizeDepth: 10,
  });
}

export const sentryCaptureException = (
  error: Error,
  prettifiedMetaData?: LoggerMetaData,
) => {
  if (env.BACKEND_SENTRYHAWK_DSN) {
    Sentry.captureException(error, prettifiedMetaData);
  }
};
