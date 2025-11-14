import _ from "lodash";

import { trpc } from "../../lib/trpc";

export const getMeTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  return { me: ctx.me && _.pick(ctx.me, ["id", "nickname"]) };
});
