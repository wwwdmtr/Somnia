import _ from "lodash";

import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { hasUserBlockRelation } from "../../lib/userContentBlock";

import { zGetUserPostsTrpcInput } from "./input";

export const getUserPostsTrpcRoute = trpcLoggedProcedure
  .input(zGetUserPostsTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.prisma.user.findUnique({
      where: {
        id: input.userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new ExpectedError("Пользователь не найден");
    }

    if (ctx.me.id !== input.userId) {
      const blocked = await hasUserBlockRelation({
        prisma: ctx.prisma,
        firstUserId: ctx.me.id,
        secondUserId: input.userId,
      });

      if (blocked) {
        throw new ExpectedError("Контент пользователя недоступен");
      }
    }

    const rawPosts = await ctx.prisma.post.findMany({
      where: {
        authorId: input.userId,
        deletedAt: null,
        publisherType: "USER",
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
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        postLikes: {
          where: {
            userId: ctx.me.id,
          },
          select: {
            id: true,
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
      },
    });

    let nextCursor: number | null = null;
    if (rawPosts.length > input.limit) {
      rawPosts.pop();
      nextCursor = rawPosts[rawPosts.length - 1]?.seq ?? null;
    }

    const posts = rawPosts.map((post) => ({
      ..._.omit(post, ["_count", "postLikes"]),
      commentsCount: post._count.comments,
      likesCount: post._count.postLikes,
      isLikedByMe: post.postLikes.length > 0,
    }));

    return { posts, nextCursor };
  });
