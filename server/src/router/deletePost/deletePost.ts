import { trpc } from "../../lib/trpc";
import { canDeleteThisPost } from "../../utils/can";

import { zDeletePostTrpcInput } from "./input";

export const deletePostTrpcRoute = trpc.procedure
  .input(zDeletePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { postId } = input;

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, deletedAt: true },
    });

    if (!post || post.deletedAt) {
      throw new Error("Post not found");
    }

    if (!canDeleteThisPost(ctx.me, post)) {
      throw new Error("Unauthorized");
    }

    await ctx.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    return true;
  });
