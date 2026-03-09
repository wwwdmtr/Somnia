import * as Sentry from "@sentry/react";
import { useEffect } from "react";

import { useMe } from "./ctx";
import { env } from "./env";

if (env.WEBAPP_SENTRYHAWK_DSN) {
  Sentry.init({
    dsn: env.WEBAPP_SENTRYHAWK_DSN,
    environment: env.NODE_ENV,
    normalizeDepth: 10,
  });
}

export const sentryCaptureException = (error: Error) => {
  if (env.WEBAPP_SENTRYHAWK_DSN) {
    Sentry.captureException(error);
  }
};

export const SentryUser = () => {
  const me = useMe();
  useEffect(() => {
    if (env.WEBAPP_SENTRYHAWK_DSN) {
      if (me) {
        Sentry.setUser({
          email: me.email,
          id: me.id,
          ip_address: "{{auto}}",
          username: me.nickname,
        });
      } else {
        Sentry.setUser(null);
      }
    }
  }, [me]);
  return null;
};
