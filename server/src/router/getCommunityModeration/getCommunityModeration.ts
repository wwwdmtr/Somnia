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

    if (community.ownerId !== ctx.me.id) {
      throw new Error("Unauthorized");
    }

    const normalizedSearch = input.search?.trim();

    const [moderatorMemberships, subscriptions] = await Promise.all([
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
    ]);

    const moderators = moderatorMemberships
      .map((membership) => membership.user)
      .sort(byNickname);

    const moderatorIds = new Set(moderators.map((moderator) => moderator.id));

    const subscribers = subscriptions
      .map((subscription) => ({
        ...subscription.user,
        isModerator: moderatorIds.has(subscription.userId),
      }))
      .filter((subscriber) => subscriber.id !== community.ownerId)
      .sort(byNickname);

    return {
      owner: community.owner,
      moderators,
      subscribers,
    };
  });
