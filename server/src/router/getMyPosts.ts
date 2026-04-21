import _ from "lodash";
import { z } from "zod";

import { trpcLoggedProcedure } from "../lib/trpc";

export const getMyPostsTrpcRoute = trpcLoggedProcedure
  .input(
    z.object({
      authorId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const userId = ctx.me?.id;

    const rawPosts = await ctx.prisma.post.findMany({
      where: {
        authorId: input.authorId,
        deletedAt: null,
        publisherType: "USER",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        publisherCommunity: {
          select: {
            id: true,
            name: true,
            avatar: true,
            isVerified: true,
          },
        },
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        postLikes: userId
          ? {
              where: {
                userId,
              },
              select: {
                id: true,
              },
            }
          : false,
        _count: {
          select: {
            postLikes: true,
            comments: {
              where: { deletedAt: null },
            },
          },
        },
      },
    });

    const posts = rawPosts.map((post) => ({
      ..._.omit(post, ["_count", "postLikes"]),
      commentsCount: post._count.comments,
      likesCount: post._count.postLikes,
      isLikedByMe: post.postLikes.length > 0,
    }));

    return { posts };
  });
