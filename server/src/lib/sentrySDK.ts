import * as Sentry from '@sentry/node';

import { env } from './env';
import { type LoggerMetaData } from './logger';

const isSentryEnabled = env.BACKEND_SENTRYHAWK_DSN && env.NODE_ENV !== 'test';

if (isSentryEnabled) {
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
  if (isSentryEnabled) {
    Sentry.captureException(error, prettifiedMetaData);
  }
};
