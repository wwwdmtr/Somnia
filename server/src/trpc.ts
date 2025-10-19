import { initTRPC } from "@trpc/server";

const respond = "hello";

const trpc = initTRPC.create();

export const trpcRouter = trpc.router({
  getRespond: trpc.procedure.query(() => {
    return { respond };
  }),
});

export type trpcRouter = typeof trpcRouter;
