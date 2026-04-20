import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSetCommunityModeratorTrpcInput } from "./input";

export const setCommunityModeratorTrpcRoute = trpcLoggedProcedure
  .input(zSetCommunityModeratorTrpcInput)
  .mutation(async ({ ctx, input }) => {
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

    if (community.ownerId !== ctx.me.id) {
      throw new Error("Unauthorized");
    }

    if (input.userId === community.ownerId) {
      throw new ExpectedError("Нельзя изменить роль владельца сообщества");
    }

    if (input.isModerator) {
      const subscription = await ctx.prisma.communitySubscription.findUnique({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: input.userId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!subscription) {
        throw new ExpectedError("Пользователь должен быть подписчиком");
      }

      await ctx.prisma.communityMember.upsert({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: input.userId,
          },
        },
        update: {
          role: "MODERATOR",
        },
        create: {
          communityId: input.communityId,
          userId: input.userId,
          role: "MODERATOR",
        },
      });

      return {
        communityId: input.communityId,
        userId: input.userId,
        isModerator: true,
      };
    }

    await ctx.prisma.communityMember.deleteMany({
      where: {
        communityId: input.communityId,
        userId: input.userId,
        role: "MODERATOR",
      },
    });

    return {
      communityId: input.communityId,
      userId: input.userId,
      isModerator: false,
    };
  });
