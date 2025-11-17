import { trpc } from "../lib/trpc";

import { createDreamTrpcRoute } from "./createDream/createDream";
import { getDreamTrpcRoute } from "./getDream";
import { getDreamsTrpcRoute } from "./getDreams";
import { getMeTrpcRoute } from "./getMe/getMe";
import { signInTrpcRoute } from "./signIn/signIn";
import { signUpTrpcRoute } from "./signUp/signUp";
import { updateDreamTrpcRoute } from "./updateDream/updateDream";

export const trpcRouter = trpc.router({
  getDreams: getDreamsTrpcRoute,
  getDream: getDreamTrpcRoute,
  createDream: createDreamTrpcRoute,
  signUp: signUpTrpcRoute,
  signIn: signInTrpcRoute,
  getMe: getMeTrpcRoute,
  updateDream: updateDreamTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
