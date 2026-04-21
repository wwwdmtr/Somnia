import _ from "lodash";

import { trpcLoggedProcedure } from "../../lib/trpc";
import { isUserAdmin } from "../../utils/can";

import { zGetDeletedPostsTrpcInput } from "./input";

export const getDeletedPostsTrpcRoute = trpcLoggedProcedure
  .input(zGetDeletedPostsTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!isUserAdmin(ctx.me)) {
      throw new Error("Unauthorized");
    }

    const userId = ctx.me?.id;

    const rawPosts = await ctx.prisma.post.findMany({
      where: {
        deletedAt: { not: null },
      },
      take: input.limit + 1,
      ...(input.cursor && {
        cursor: { seq: input.cursor },
        skip: 1,
      }),
      orderBy: {
        seq: "desc",
      },
      select: {
        id: true,
        seq: true,
        title: true,
        description: true,
        text: true,
        images: true,
        createdAt: true,
        publisherType: true,
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
            nickname: true,
            avatar: true,
          },
        },

        _count: {
          select: {
            postLikes: true,
            comments: {
              where: { deletedAt: null },
            },
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
      },
    });

    let nextCursor: number | null = null;
    if (rawPosts.length > input.limit) {
      rawPosts.pop();
      nextCursor = rawPosts[rawPosts.length - 1]?.seq ?? null;
    }

    const posts = rawPosts.map((post) => {
      return {
        ..._.omit(post, ["_count", "postLikes", "author"]),
        author: post.author,
        likesCount: post._count.postLikes,
        commentsCount: post._count.comments,
        isLikedByMe: post.postLikes.length > 0,
      };
    });

    return { posts, nextCursor };
  });
