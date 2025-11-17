import { trpc } from "../../lib/trpc";

import { zUpdateDreamTrpcInput } from "./input";

export const updateDreamTrpcRoute = trpc.procedure
  .input(zUpdateDreamTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { dreamId, ...dreamInput } = input;
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const dream = await ctx.prisma.dream.findUnique({
      where: { id: dreamId },
    });

    if (!dream) {
      throw new Error("Dream not found");
    }

    if (dream.authorId !== ctx.me.id) {
      throw new Error("Not your idea");
    }

    await ctx.prisma.dream.update({
      where: { id: dreamId },
      data: { ...dreamInput },
    });
    return true;
  });
