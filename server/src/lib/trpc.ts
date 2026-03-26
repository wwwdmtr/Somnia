import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { type Express } from "express";
import { expressHandler } from "trpc-playground/handlers/express";

import { type TrpcRouter } from "../router";
import { type ExpressRequest } from "../utils/types";

import { type AppContext } from "./ctx";
import { ExpectedError } from "./error";
import { logger } from "./logger";

import type { DataTransformerOptions } from "@trpc/server/unstable-core-do-not-import";

const unwrapJsonEnvelope = (obj: unknown) => {
  if (
    obj &&
    typeof obj === "object" &&
    "json" in obj &&
    Object.keys(obj as Record<string, unknown>).length <= 2
  ) {
    return (obj as { json: unknown }).json;
  }
  return obj;
};

const jsonTransformer: DataTransformerOptions = {
  input: {
    serialize: (obj) => obj,
    deserialize: (obj) => unwrapJsonEnvelope(obj),
  },
  output: {
    serialize: (obj) => obj,
    deserialize: (obj) => unwrapJsonEnvelope(obj),
  },
};

export const getTrpcContext = ({
  appContext,
  req,
}: {
  appContext: AppContext;
  req: ExpressRequest;
}) => ({
  ...appContext,
  me: req.user || null,
});

const getCreateTrpcContext =
  (appContext: AppContext) =>
  ({ req }: trpcExpress.CreateExpressContextOptions) =>
    getTrpcContext({ appContext, req: req as ExpressRequest });

type TrpcContext = ReturnType<typeof getTrpcContext>;

const trpc = initTRPC.context<TrpcContext>().create({
  transformer: jsonTransformer,
  errorFormatter: ({ shape, error }) => {
    const isExpected = error.cause instanceof ExpectedError;
    return {
      ...shape,
      data: {
        ...shape.data,
        isExpected,
      },
    };
  },
});

export const createTrpcRouter = trpc.router;

export const trpcLoggedProcedure = trpc.procedure.use(
  trpc.middleware(async ({ path, type, next, ctx, getRawInput, input }) => {
    const start = Date.now();
    const result = await next();
    const rawInput = await getRawInput();
    const durationMs = Date.now() - start;
    const meta = {
      path,
      type,
      userId: ctx.me?.id || null,
      durationMs,
      rawInput: rawInput || null,
      input: input || null,
    };
    if (result.ok) {
      logger.info(`trpc:${type}:success`, "Successfull request", {
        ...meta,
        output: result.data,
      });
    } else if (result.ok === false) {
      logger.error(`trpc:${type}:error`, result.error, meta);
    }
    return result;
  }),
);

export const applyTrpcToExpressApp = async (
  expressApp: Express,
  appContext: AppContext,
  trpcRouter: TrpcRouter,
) => {
  expressApp.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: trpcRouter,
      createContext: getCreateTrpcContext(appContext),
    }),
  );
  expressApp.use(
    "/trpc-playground",
    await expressHandler({
      trpcApiEndpoint: "/trpc",
      playgroundEndpoint: "/trpc-playground",
      router: trpcRouter,
      request: {
        superjson: false,
      },
    }),
  );
};
