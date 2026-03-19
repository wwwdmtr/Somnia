import { EOL } from "os";

import { TRPCError } from "@trpc/server";
import debug from "debug";
import _ from "lodash";
import pc from "picocolors";
import { serializeError } from "serialize-error";
import { MESSAGE } from "triple-beam";
import winston from "winston";
import * as yaml from "yaml";

import { deepMap } from "../utils/deepMap";

import { env } from "./env";
import { ExpectedError } from "./error";
import { sentryCaptureException } from "./sentrySDK";

debug.enable(env.DEBUG ?? "");

export const winstonLogger = winston.createLogger({
  defaultMeta: { service: "backend", host: env.SERVER_URL },
  transports: [
    new winston.transports.Console({
      format:
        env.SERVER_URL !== "http://localhost:3000"
          ? winston.format.json()
          : winston.format((logData) => {
              const setColor = {
                info: (str: string) => pc.blue(str),
                error: (str: string) => pc.red(str),
                debug: (str: string) => pc.cyan(str),
              }[logData.level as "info" | "error" | "debug"];
              const levelAndType = `${logData.level} ${logData.logType}`;
              const topMessage = `${setColor(levelAndType)} ${pc.green(
                String(logData.timestamp ?? ""),
              )}${EOL}${logData.message}`;

              const visibleMessageTags = _.omit(logData, [
                "level",
                "logType",
                "timestamp",
                "message",
                "service",
                "SERVER_URL",
              ]);

              const stringifyedLogData = _.trim(
                yaml.stringify(visibleMessageTags, (_k, v) =>
                  _.isFunction(v) ? "Function" : v,
                ),
              );

              const resultLogData = {
                ...logData,
                [MESSAGE]:
                  [
                    topMessage,
                    Object.keys(visibleMessageTags).length > 0
                      ? `${EOL}${stringifyedLogData}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join("") + EOL,
              };

              return resultLogData;
            })(),
    }),
  ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LoggerMetaData = Record<string, any> | undefined;

const prettifyMeta = (meta: LoggerMetaData): LoggerMetaData => {
  return deepMap(meta, ({ key, value }) => {
    if (
      [
        "email",
        "password",
        "token",
        "currentPassword",
        "newPassword",
        "apiKey",
        "signature",
      ].includes(key)
    ) {
      return "[SENSITIVE]";
    }
    return value;
  });
};

export const logger = {
  info: (logType: string, message: string, meta?: LoggerMetaData) => {
    if (!debug.enabled(`somnia:${logType}`)) {
      return;
    }
    winstonLogger.info(message, { logType, ...prettifyMeta(meta) });
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (logType: string, error: any, meta?: LoggerMetaData) => {
    const isNativeExpectedError = error instanceof ExpectedError;
    const isTrpcExpectedError =
      error instanceof TRPCError && error.cause instanceof ExpectedError;
    const prettifiedMetaData = prettifyMeta(meta);
    if (!isNativeExpectedError && !isTrpcExpectedError) {
      sentryCaptureException(error, prettifiedMetaData);
    }
    const serializedError = serializeError(error);
    winstonLogger.error(serializedError.message || "Unknown error", {
      logType,
      error,
      errorStack: serializedError.stack,
      ...prettifiedMetaData,
    });
  },
};
