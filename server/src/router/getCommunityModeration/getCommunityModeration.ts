import {
  getCommunityMembershipRole,
  isCommunityManagerRole,
} from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetCommunityModerationTrpcInput } from "./input";

const byNickname = <T extends { nickname: string }>(a: T, b: T) =>
  a.nickname.localeCompare(b.nickname, "ru");

export const getCommunityModerationTrpcRoute = trpcLoggedProcedure
  .input(zGetCommunityModerationTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const community = await ctx.prisma.community.findUnique({
      where: {
        id: input.communityId,
      },
      select: {
        id: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            nickname: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    const myRole = await getCommunityMembershipRole({
      prisma: ctx.prisma,
      communityId: input.communityId,
      userId: ctx.me.id,
    });

    if (community.ownerId !== ctx.me.id && !isCommunityManagerRole(myRole)) {
      throw new Error("Unauthorized");
    }

    const normalizedSearch = input.search?.trim();
    const now = new Date();

    const [moderatorMemberships, subscriptions, blockedEntries] =
      await Promise.all([
        ctx.prisma.communityMember.findMany({
          where: {
            communityId: input.communityId,
            role: "MODERATOR",
          },
          select: {
            user: {
              select: {
                id: true,
                nickname: true,
                name: true,
                avatar: true,
              },
            },
          },
        }),
        ctx.prisma.communitySubscription.findMany({
          where: {
            communityId: input.communityId,
            ...(normalizedSearch
              ? {
                  user: {
                    nickname: {
                      contains: normalizedSearch,
                      mode: "insensitive",
                    },
                  },
                }
              : {}),
          },
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                nickname: true,
                name: true,
                avatar: true,
              },
            },
          },
        }),
        ctx.prisma.communityBlacklist.findMany({
          where: {
            communityId: input.communityId,
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
            ...(normalizedSearch
              ? {
                  user: {
                    nickname: {
                      contains: normalizedSearch,
                      mode: "insensitive",
                    },
                  },
                }
              : {}),
          },
          select: {
            userId: true,
            createdAt: true,
            expiresAt: true,
            user: {
              select: {
                id: true,
                nickname: true,
                name: true,
                avatar: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                nickname: true,
                name: true,
                avatar: true,
              },
            },
          },
        }),
      ]);

    const moderators = moderatorMemberships
      .map((membership) => membership.user)
      .sort(byNickname);

    const moderatorIds = new Set(moderators.map((moderator) => moderator.id));
    const blockedUserIds = new Set(
      blockedEntries.map((blockedEntry) => blockedEntry.userId),
    );

    const subscribers = subscriptions
      .map((subscription) => ({
        ...subscription.user,
        isModerator: moderatorIds.has(subscription.userId),
      }))
      .filter(
        (subscriber) =>
          subscriber.id !== community.ownerId &&
          !blockedUserIds.has(subscriber.id),
      )
      .sort(byNickname);

    const blockedUsers = blockedEntries
      .map((blockedEntry) => ({
        ...blockedEntry.user,
        blockedAt: blockedEntry.createdAt,
        expiresAt: blockedEntry.expiresAt,
        blockedBy: blockedEntry.createdBy,
      }))
      .sort((a, b) => b.blockedAt.getTime() - a.blockedAt.getTime());

    return {
      owner: community.owner,
      moderators,
      subscribers,
      blockedUsers,
    };
  });
