import { Platform } from "react-native";

import { env } from "./env";

type SentryModule = typeof import("@sentry/react");
type SentryUserPayload = {
  email?: string | null;
  id: string;
  username?: string | null;
} | null;

const isSentryEnabled = Platform.OS === "web" && Boolean(env.SENTRYHAWK_DSN);
let sentryModulePromise: Promise<SentryModule | null> | null = null;
let isSentryInitialized = false;

const getSentryModule = async (): Promise<SentryModule | null> => {
  if (!isSentryEnabled) {
    return null;
  }

  if (!sentryModulePromise) {
    sentryModulePromise = import("@sentry/react")
      .then((sentryModule) => {
        if (!isSentryInitialized) {
          sentryModule.init({
            dsn: env.SENTRYHAWK_DSN,
            environment: env.NODE_ENV,
            normalizeDepth: 10,
          });
          isSentryInitialized = true;
        }

        return sentryModule;
      })
      .catch(() => null);
  }

  return sentryModulePromise;
};

export const sentryCaptureException = (error: unknown) => {
  void getSentryModule().then((sentryModule) => {
    if (!sentryModule) {
      return;
    }
    sentryModule.captureException(error);
  });
};

export const sentrySetUser = (user: SentryUserPayload) => {
  void getSentryModule().then((sentryModule) => {
    if (!sentryModule) {
      return;
    }

    if (!user) {
      sentryModule.setUser(null);
      return;
    }

    sentryModule.setUser({
      email: user.email ?? undefined,
      id: user.id,
      ip_address: "{{auto}}",
      username: user.username ?? undefined,
    });
  });
};
