import { trpc } from "../../lib/trpc";

import { zCreateDreamTrpcInput } from "./input";

export const createDreamTrpcRoute = trpc.procedure
  .input(zCreateDreamTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }
    const dream = await ctx.prisma.dream.create({
      data: {
        title: input.title,
        description: input.description,
        text: input.text,
        author: { connect: { id: ctx.me.id } },
      },
    });

    return dream;
  });
