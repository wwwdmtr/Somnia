import { trpc } from "../../lib/trpc";

import { zUpdatePostTrpcInput } from "./input";

export const updatePostTrpcRoute = trpc.procedure
  .input(zUpdatePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { postId, ...postInput } = input;
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== ctx.me.id) {
      throw new Error("Not your idea");
    }

    await ctx.prisma.post.update({
      where: { id: postId },
      data: { ...postInput },
    });
    return true;
  });
