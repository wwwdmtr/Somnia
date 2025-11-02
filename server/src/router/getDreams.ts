import { dreams } from "../lib/dreams";
import { trpc } from "../lib/trpc";

export const getDreamsTrpcRoute = trpc.procedure.query(() => {
  return { dreams };
});
