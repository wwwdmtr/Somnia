import {
  getCommunityMembershipRole,
  isCommunityManagerRole,
} from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetCommunityModerationListTrpcInput } from "./input";

export const getCommunityModerationListTrpcRoute = trpcLoggedProcedure
  .input(zGetCommunityModerationListTrpcInput)
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

    if (input.list === "MODERATORS") {
      const rawModerators = await ctx.prisma.communityMember.findMany({
        where: {
          communityId: input.communityId,
          role: "MODERATOR",
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
        take: input.limit + 1,
        ...(input.cursor
          ? {
              cursor: {
                id: input.cursor,
              },
              skip: 1,
            }
          : {}),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          user: {
            select: {
              id: true,
              nickname: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      let nextCursor: string | null = null;
      if (rawModerators.length > input.limit) {
        rawModerators.pop();
        nextCursor = rawModerators[rawModerators.length - 1]?.id ?? null;
      }

      return {
        items: rawModerators.map((moderator) => moderator.user),
        nextCursor,
      };
    }

    if (input.list === "SUBSCRIBERS") {
      const now = new Date();

      const rawSubscribers = await ctx.prisma.communitySubscription.findMany({
        where: {
          communityId: input.communityId,
          userId: {
            not: community.ownerId,
          },
          user: {
            communityMemberships: {
              none: {
                communityId: input.communityId,
                role: {
                  in: ["OWNER", "MODERATOR"],
                },
              },
            },
            communityBlacklistEntries: {
              none: {
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
              },
            },
            ...(normalizedSearch
              ? {
                  nickname: {
                    contains: normalizedSearch,
                    mode: "insensitive",
                  },
                }
              : {}),
          },
        },
        take: input.limit + 1,
        ...(input.cursor
          ? {
              cursor: {
                id: input.cursor,
              },
              skip: 1,
            }
          : {}),
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          user: {
            select: {
              id: true,
              nickname: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      let nextCursor: string | null = null;
      if (rawSubscribers.length > input.limit) {
        rawSubscribers.pop();
        nextCursor = rawSubscribers[rawSubscribers.length - 1]?.id ?? null;
      }

      return {
        items: rawSubscribers.map(
          (subscriber: {
            user: {
              id: string;
              nickname: string;
              name: string;
              avatar: string | null;
            };
          }) => subscriber.user,
        ),
        nextCursor,
      };
    }

    const now = new Date();

    const rawBlockedUsers = await ctx.prisma.communityBlacklist.findMany({
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
      take: input.limit + 1,
      ...(input.cursor
        ? {
            cursor: {
              id: input.cursor,
            },
            skip: 1,
          }
        : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
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
    });

    let nextCursor: string | null = null;
    if (rawBlockedUsers.length > input.limit) {
      rawBlockedUsers.pop();
      nextCursor = rawBlockedUsers[rawBlockedUsers.length - 1]?.id ?? null;
    }

    return {
      items: rawBlockedUsers.map((blockedUser) => ({
        ...blockedUser.user,
        blockedAt: blockedUser.createdAt,
        expiresAt: blockedUser.expiresAt,
        blockedBy: blockedUser.createdBy,
      })),
      nextCursor,
    };
  });
