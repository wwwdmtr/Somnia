import { initTRPC } from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import { type Express } from "express";
import superjson from "superjson";

import { type TrpcRouter } from "../router";

import { AppContext } from "./ctx";

import type { DataTransformerOptions } from "@trpc/server/unstable-core-do-not-import";

const dataTransformer: DataTransformerOptions = superjson;

export const trpc = initTRPC.context<AppContext>().create({
  transformer: dataTransformer,
});

export const applyTrpcToExpressApp = (
  expressApp: Express,
  appContext: AppContext,
  trpcRouter: TrpcRouter,
) => {
  expressApp.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
      router: trpcRouter,
      createContext: () => appContext,
    }),
  );
};
