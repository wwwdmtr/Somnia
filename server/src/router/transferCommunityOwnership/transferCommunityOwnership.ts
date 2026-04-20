import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zTransferCommunityOwnershipTrpcInput } from "./input";

export const transferCommunityOwnershipTrpcRoute = trpcLoggedProcedure
  .input(zTransferCommunityOwnershipTrpcInput)
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

    if (input.newOwnerUserId === community.ownerId) {
      throw new ExpectedError("Пользователь уже владелец сообщества");
    }

    const targetSubscription =
      await ctx.prisma.communitySubscription.findUnique({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: input.newOwnerUserId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!targetSubscription) {
      throw new ExpectedError(
        "Передать владение можно только подписчику сообщества",
      );
    }

    await ctx.prisma.$transaction([
      ctx.prisma.community.update({
        where: {
          id: input.communityId,
        },
        data: {
          ownerId: input.newOwnerUserId,
        },
      }),
      ctx.prisma.communityMember.updateMany({
        where: {
          communityId: input.communityId,
          userId: community.ownerId,
          role: "OWNER",
        },
        data: {
          role: "MODERATOR",
        },
      }),
      ctx.prisma.communityMember.upsert({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: input.newOwnerUserId,
          },
        },
        create: {
          communityId: input.communityId,
          userId: input.newOwnerUserId,
          role: "OWNER",
        },
        update: {
          role: "OWNER",
        },
      }),
    ]);

    return {
      communityId: input.communityId,
      previousOwnerUserId: community.ownerId,
      newOwnerUserId: input.newOwnerUserId,
    };
  });
