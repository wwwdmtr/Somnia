import _ from "lodash";

import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetCommunityPostsTrpcInput } from "./input";

export const getCommunityPostsTrpcRoute = trpcLoggedProcedure
  .input(zGetCommunityPostsTrpcInput)
  .query(async ({ ctx, input }) => {
    const userId = ctx.me?.id;
    let canSeeCommunityAuthor = false;

    const community = await ctx.prisma.community.findUnique({
      where: {
        id: input.communityId,
      },
      select: {
        id: true,
      },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    if (userId) {
      const membership = await ctx.prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId,
          },
        },
        select: {
          role: true,
        },
      });

      canSeeCommunityAuthor =
        membership?.role === "OWNER" || membership?.role === "MODERATOR";
    }

    const rawPosts = await ctx.prisma.post.findMany({
      where: {
        deletedAt: null,
        publisherType: "COMMUNITY",
        publisherCommunityId: input.communityId,
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
          },
        },
        author: {
          select: {
            id: true,
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

    const posts = rawPosts.map((post) => ({
      ..._.omit(post, ["_count", "postLikes", "author"]),
      ...(canSeeCommunityAuthor ? { author: post.author } : {}),
      likesCount: post._count.postLikes,
      commentsCount: post._count.comments,
      isLikedByMe: post.postLikes.length > 0,
    }));

    return { posts, nextCursor };
  });
