import cors from "cors";
import express from "express";

import { AppContext, createAppContext } from "./lib/ctx";
import { env } from "./lib/env";
import { applyPassportToExpressApp } from "./lib/passport";
import { applyTrpcToExpressApp } from "./lib/trpc";
import { trpcRouter } from "./router/index";
import { presetDB } from "./scripts/presetDB";

const parseList = (value: string | undefined): string[] | undefined =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

//eslint-disable-next-line node/no-process-env
const explicitOrigins = parseList(process.env.CORS_ORIGINS);
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:19006",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:19006",
] as string[];
const allowedOrigins: string[] =
  explicitOrigins && explicitOrigins.length > 0
    ? explicitOrigins
    : [...DEFAULT_ALLOWED_ORIGINS];
const allowAllInDev =
  //eslint-disable-next-line node/no-process-env
  !explicitOrigins?.length && process.env.NODE_ENV !== "production";

void (async () => {
  let ctx: AppContext | null = null;
  try {
    ctx = createAppContext();
    await presetDB(ctx);
    const expressApp = express();

    expressApp.use(
      cors({
        origin(origin, callback) {
          if (!origin) {
            callback(null, true);
            return;
          }

          if (allowAllInDev || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
          }

          callback(
            new Error(
              `Origin ${origin} is not allowed. Set CORS_ORIGINS to configure allowed origins.`,
            ),
          );
        },
        credentials: true,
      }),
    );
    applyPassportToExpressApp(expressApp, ctx);
    await applyTrpcToExpressApp(expressApp, ctx, trpcRouter);

    expressApp.listen(env.PORT, () => {
      console.info(`Server is running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    await ctx?.stop();
  }
})();
