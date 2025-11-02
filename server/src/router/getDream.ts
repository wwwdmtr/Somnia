import { z } from "zod";

import { dreams } from "../lib/dreams";
import { trpc } from "../lib/trpc";

export const getDreamTrpcRoute = trpc.procedure
  .input(
    z.object({
      id: z.number(),
    }),
  )
  .query(({ input }) => {
    const dream = dreams.find((dream) => dream.id === input.id);
    return { dream: dream || null };
  });
