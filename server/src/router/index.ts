import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

import { trpc } from "../lib/trpc";

import { createDreamTrpcRoute } from "./createDream/createDream";
import { getDreamTrpcRoute } from "./getDream";
import { getDreamsTrpcRoute } from "./getDreams";
import { getMeTrpcRoute } from "./getMe/getMe";
import { signInTrpcRoute } from "./signIn/signIn";
import { signUpTrpcRoute } from "./signUp/signUp";
import { updateDreamTrpcRoute } from "./updateDream/updateDream";
import { updateProfileTrpcRoute } from "./updateProfile/updateProfile";

export const trpcRouter = trpc.router({
  getDreams: getDreamsTrpcRoute,
  getDream: getDreamTrpcRoute,
  createDream: createDreamTrpcRoute,
  signUp: signUpTrpcRoute,
  signIn: signInTrpcRoute,
  getMe: getMeTrpcRoute,
  updateDream: updateDreamTrpcRoute,
  updateProfile: updateProfileTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
export type TrpcRouterInput = inferRouterInputs<TrpcRouter>;
export type TrpcRouterOutput = inferRouterOutputs<TrpcRouter>;
