import {
  getActiveCommunityBlacklistEntry,
  isCommunityManagerRole,
  notifyExpiredCommunityBlacklistEntriesForUser,
} from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetCommunityTrpcInput } from "./input";

export const getCommunityTrpcRoute = trpcLoggedProcedure
  .input(zGetCommunityTrpcInput)
  .query(async ({ ctx, input }) => {
    if (ctx.me) {
      await notifyExpiredCommunityBlacklistEntriesForUser({
        prisma: ctx.prisma,
        userId: ctx.me.id,
      });
    }

    const community = await ctx.prisma.community.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            posts: {
              where: {
                deletedAt: null,
                publisherType: "COMMUNITY",
              },
            },
          },
        },
      },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    const meMember = ctx.me
      ? await ctx.prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId: input.id,
              userId: ctx.me.id,
            },
          },
          select: {
            role: true,
          },
        })
      : null;
    const isManagedCommunity = isCommunityManagerRole(meMember?.role ?? null);

    if (ctx.me && !isManagedCommunity) {
      const blacklistEntry = await getActiveCommunityBlacklistEntry({
        prisma: ctx.prisma,
        communityId: input.id,
        userId: ctx.me.id,
      });

      if (blacklistEntry) {
        throw new ExpectedError(
          "Вы добавлены в черный список этого сообщества",
        );
      }
    }

    const isSubscribedByMe = ctx.me
      ? !!(await ctx.prisma.communitySubscription.findUnique({
          where: {
            communityId_userId: {
              communityId: input.id,
              userId: ctx.me.id,
            },
          },
          select: {
            id: true,
          },
        })) || isManagedCommunity
      : false;
    const isBlockedByMe = ctx.me
      ? Boolean(
          await ctx.prisma.userBlockedCommunity.findUnique({
            where: {
              userId_communityId: {
                userId: ctx.me.id,
                communityId: input.id,
              },
            },
            select: {
              id: true,
            },
          }),
        )
      : false;

    return {
      community: {
        ...community,
        membersCount: community._count.subscriptions,
        postsCount: community._count.posts,
        myRole: meMember?.role ?? null,
        isSubscribedByMe,
        isBlockedByMe,
      },
    };
  });
