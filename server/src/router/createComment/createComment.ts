import { trpc } from "../../lib/trpc";

import { zCreateCommentTrpcInput } from "./input";

export const createCommentTrpcRoute = trpc.procedure
  .input(zCreateCommentTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const post = await ctx.prisma.post.findUnique({
      where: { id: input.postId },
      select: { id: true },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    if (input.parentId) {
      const parentComment = await ctx.prisma.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true },
      });
      if (!parentComment) {
        throw new Error("Parent comment not found");
      }

      if (parentComment.postId !== input.postId) {
        throw new Error("Parent comment doesn't belong to this post");
      }
    }

    const comment = await ctx.prisma.comment.create({
      data: {
        content: input.content,
        postId: input.postId,
        authorId: ctx.me.id,
        parentId: input.parentId ?? null,
      },
    });

    return comment;
  });
