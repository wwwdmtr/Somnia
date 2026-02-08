import _ from "lodash";
import { z } from "zod";

import { trpc } from "../lib/trpc";

export const getPostTrpcRoute = trpc.procedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const rawPost = await ctx.prisma.post.findUnique({
      where: { id: input.id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
        postLikes: {
          select: {
            id: true,
          },
          where: {
            ...(ctx.me && { userId: ctx.me.id }),
          },
        },
        _count: {
          select: { postLikes: true },
        },
      },
    });

    if (rawPost?.deletedAt) {
      throw new Error("Пост был удален");
    }

    const isLikedByMe = !!rawPost?.postLikes.length;
    const likesCount = rawPost?._count.postLikes || 0;
    const post = rawPost && {
      ..._.omit(rawPost, ["postLikes", "_count"]),
      likesCount,
      isLikedByMe,
    };

    return { post };
  });
