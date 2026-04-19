import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSetCommunitySubscriptionTrpcInput } from "./input";

export const setCommunitySubscriptionTrpcRoute = trpcLoggedProcedure
  .input(zSetCommunitySubscriptionTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const community = await ctx.prisma.community.findUnique({
      where: { id: input.communityId },
      select: { id: true },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    if (input.isSubscribed) {
      await ctx.prisma.communitySubscription.upsert({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: ctx.me.id,
          },
        },
        create: {
          communityId: input.communityId,
          userId: ctx.me.id,
        },
        update: {},
      });

      return {
        communityId: input.communityId,
        isSubscribed: true,
      };
    }

    const myRole = await ctx.prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: input.communityId,
          userId: ctx.me.id,
        },
      },
      select: {
        role: true,
      },
    });

    if (myRole?.role === "OWNER" || myRole?.role === "MODERATOR") {
      throw new ExpectedError(
        "Нельзя отписаться от сообщества, где вы владелец или модератор",
      );
    }

    await ctx.prisma.communitySubscription.deleteMany({
      where: {
        communityId: input.communityId,
        userId: ctx.me.id,
      },
    });

    return {
      communityId: input.communityId,
      isSubscribed: false,
    };
  });
