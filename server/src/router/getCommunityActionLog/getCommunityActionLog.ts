import {
  getCommunityMembershipRole,
  isCommunityManagerRole,
} from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetCommunityActionLogTrpcInput } from "./input";

export const getCommunityActionLogTrpcRoute = trpcLoggedProcedure
  .input(zGetCommunityActionLogTrpcInput)
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

    const rawActions = await ctx.prisma.communityActionLog.findMany({
      where: {
        communityId: input.communityId,
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
        actionType: true,
        details: true,
        actor: {
          select: {
            id: true,
            nickname: true,
            name: true,
            avatar: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            nickname: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (rawActions.length > input.limit) {
      rawActions.pop();
      nextCursor = rawActions[rawActions.length - 1]?.id ?? null;
    }

    return {
      actions: rawActions,
      nextCursor,
    };
  });
