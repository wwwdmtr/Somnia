import { EOL } from "os";

import debug from "debug";
import _ from "lodash";
import pc from "picocolors";
import { serializeError } from "serialize-error";
import { MESSAGE } from "triple-beam";
import winston from "winston";
import * as yaml from "yaml";

import { env } from "./env";

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

export const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (logType: string, message: string, meta?: Record<string, any>) => {
    if (debug.enabled(`somnia:${logType}`)) {
      return;
    }
    winstonLogger.info(message, { logType, ...meta });
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (logType: string, error: any, meta?: Record<string, any>) => {
    if (debug.enabled(`somnia:${logType}`)) {
      return;
    }
    const serializedError = serializeError(error);
    winstonLogger.error(serializedError.message || "Unknown error", {
      logType,
      error,
      errorStack: serializedError.stack,
      ...meta,
    });
  },
};
