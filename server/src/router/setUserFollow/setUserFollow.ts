import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSetUserFollowTrpcInput } from "./input";

export const setUserFollowTrpcRoute = trpcLoggedProcedure
  .input(zSetUserFollowTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    if (ctx.me.id === input.userId) {
      throw new ExpectedError("Нельзя подписаться на самого себя");
    }

    const targetUser = await ctx.prisma.user.findUnique({
      where: {
        id: input.userId,
      },
      select: {
        id: true,
      },
    });

    if (!targetUser) {
      throw new ExpectedError("Пользователь не найден");
    }

    if (input.isFollowing) {
      const existingFollow = await ctx.prisma.userFollow.findUnique({
        where: {
          followerId_followingId: {
            followerId: ctx.me.id,
            followingId: input.userId,
          },
        },
        select: {
          id: true,
        },
      });

      await ctx.prisma.userFollow.upsert({
        where: {
          followerId_followingId: {
            followerId: ctx.me.id,
            followingId: input.userId,
          },
        },
        create: {
          followerId: ctx.me.id,
          followingId: input.userId,
        },
        update: {},
      });

      if (!existingFollow) {
        await ctx.prisma.notification.create({
          data: {
            type: "USER_FOLLOWED",
            recipientId: input.userId,
            actorId: ctx.me.id,
          },
        });
      }

      return {
        userId: input.userId,
        isFollowing: true,
      };
    }

    await ctx.prisma.userFollow.deleteMany({
      where: {
        followerId: ctx.me.id,
        followingId: input.userId,
      },
    });

    return {
      userId: input.userId,
      isFollowing: false,
    };
  });
