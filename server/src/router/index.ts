import { trpc } from "../lib/trpc";

import { createDreamTrpcRoute } from "./createDream/createDream";
import { getDreamTrpcRoute } from "./getDream";
import { getDreamsTrpcRoute } from "./getDreams";
import { signInTrpcRoute } from "./signIn/signIn";
import { signUpTrpcRoute } from "./signUp/signUp";

export const trpcRouter = trpc.router({
  getDreams: getDreamsTrpcRoute,
  getDream: getDreamTrpcRoute,
  createDream: createDreamTrpcRoute,
  signUp: signUpTrpcRoute,
  signIn: signInTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
