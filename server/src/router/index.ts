import { trpc } from '../lib/trpc';

import { createDreamTrpcRoute } from './createDream/createDream';
import { getDreamTrpcRoute } from './getDream';
import { getDreamsTrpcRoute } from './getDreams';
import { signUpTrpcRoute } from './signUp/signUp';

export const trpcRouter = trpc.router({
  getDreams: getDreamsTrpcRoute,
  getDream: getDreamTrpcRoute,
  createDream: createDreamTrpcRoute,
  signUp: signUpTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
