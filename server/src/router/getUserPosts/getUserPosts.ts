import _ from "lodash";

import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

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

    const rawPosts = await ctx.prisma.post.findMany({
      where: {
        authorId: input.userId,
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

    const posts = rawPosts.map((post) => ({
      ..._.omit(post, ["_count", "postLikes"]),
      commentsCount: post._count.comments,
      likesCount: post._count.postLikes,
      isLikedByMe: post.postLikes.length > 0,
    }));

    return { posts };
  });
