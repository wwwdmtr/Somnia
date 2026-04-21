import { isCommunityManagerRole } from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSetUserContentBlockTrpcInput } from "./input";

export const setUserContentBlockTrpcRoute = trpcLoggedProcedure
  .input(zSetUserContentBlockTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    if (input.targetType === "USER") {
      const targetUserId = input.targetUserId!;

      if (targetUserId === ctx.me.id) {
        throw new ExpectedError("Нельзя заблокировать себя");
      }

      const user = await ctx.prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new ExpectedError("Пользователь не найден");
      }

      if (input.isBlocked) {
        await ctx.prisma.userBlockedUser.upsert({
          where: {
            userId_blockedUserId: {
              userId: ctx.me.id,
              blockedUserId: targetUserId,
            },
          },
          update: {},
          create: {
            userId: ctx.me.id,
            blockedUserId: targetUserId,
          },
        });
      } else {
        await ctx.prisma.userBlockedUser.deleteMany({
          where: {
            userId: ctx.me.id,
            blockedUserId: targetUserId,
          },
        });
      }

      return {
        targetType: input.targetType,
        targetUserId,
        isBlocked: input.isBlocked,
      };
    }

    const targetCommunityId = input.targetCommunityId!;

    const [community, myMembership] = await Promise.all([
      ctx.prisma.community.findUnique({
        where: {
          id: targetCommunityId,
        },
        select: {
          id: true,
          ownerId: true,
        },
      }),
      ctx.prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: targetCommunityId,
            userId: ctx.me.id,
          },
        },
        select: {
          role: true,
        },
      }),
    ]);

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    if (
      input.isBlocked &&
      (community.ownerId === ctx.me.id ||
        isCommunityManagerRole(myMembership?.role ?? null))
    ) {
      throw new ExpectedError(
        "Нельзя скрыть сообщество, которым вы управляете",
      );
    }

    if (input.isBlocked) {
      await ctx.prisma.userBlockedCommunity.upsert({
        where: {
          userId_communityId: {
            userId: ctx.me.id,
            communityId: targetCommunityId,
          },
        },
        update: {},
        create: {
          userId: ctx.me.id,
          communityId: targetCommunityId,
        },
      });
    } else {
      await ctx.prisma.userBlockedCommunity.deleteMany({
        where: {
          userId: ctx.me.id,
          communityId: targetCommunityId,
        },
      });
    }

    return {
      targetType: input.targetType,
      targetCommunityId,
      isBlocked: input.isBlocked,
    };
  });
