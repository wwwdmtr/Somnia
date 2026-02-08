import _ from "lodash";

import { trpc } from "../../lib/trpc";

import { zGetPostsTrpcInput } from "./input";

export const getPostsTrpcRoute = trpc.procedure
  .input(zGetPostsTrpcInput)
  .query(async ({ ctx, input }) => {
    const userId = ctx.me?.id;

    const rawPosts = await ctx.prisma.post.findMany({
      where: {
        deletedAt: null,
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
        createdAt: true,

        author: {
          select: {
            nickname: true,
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

    const posts = rawPosts.map((post) => ({
      ..._.omit(post, ["_count", "postLikes"]),
      likesCount: post._count.postLikes,
      commentsCount: post._count.comments,
      isLikedByMe: post.postLikes.length > 0,
    }));

    return { posts, nextCursor };
  });
