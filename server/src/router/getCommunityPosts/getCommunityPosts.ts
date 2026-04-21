import _ from "lodash";

import {
  getActiveCommunityBlacklistEntry,
  getCommunityMembershipRole,
  isCommunityManagerRole,
} from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { isCommunityBlockedByUser } from "../../lib/userContentBlock";

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
      const role = await getCommunityMembershipRole({
        prisma: ctx.prisma,
        communityId: input.communityId,
        userId,
      });

      canSeeCommunityAuthor = isCommunityManagerRole(role);

      if (!canSeeCommunityAuthor) {
        const [blacklistEntry, isBlockedByMe] = await Promise.all([
          getActiveCommunityBlacklistEntry({
            prisma: ctx.prisma,
            communityId: input.communityId,
            userId,
          }),
          isCommunityBlockedByUser({
            prisma: ctx.prisma,
            userId,
            communityId: input.communityId,
          }),
        ]);

        if (blacklistEntry || isBlockedByMe) {
          throw new ExpectedError("Контент сообщества недоступен");
        }
      }
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
