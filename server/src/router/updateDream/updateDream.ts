import { trpc } from "../../lib/trpc";

import { zUpdateDreamTrpcInput } from "./input";

export const updateDreamTrpcRoute = trpc.procedure
  .input(zUpdateDreamTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { dreamId, ...dreamInput } = input;
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const post = await ctx.prisma.post.findUnique({
      where: { id: dreamId },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== ctx.me.id) {
      throw new Error("Not your idea");
    }

    await ctx.prisma.post.update({
      where: { id: dreamId },
      data: { ...dreamInput },
    });
    return true;
  });
