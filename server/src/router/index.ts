import { trpc } from "../lib/trpc";

import { createDreamTrpcRoute } from "./createDream/createDream";
import { getDreamTrpcRoute } from "./getDream";
import { getDreamsTrpcRoute } from "./getDreams";

export const trpcRouter = trpc.router({
  getDreams: getDreamsTrpcRoute,
  getDream: getDreamTrpcRoute,
  createDream: createDreamTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
