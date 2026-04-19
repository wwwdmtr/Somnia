import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetUserFollowsTrpcInput } from "./input";

export const getUserFollowsTrpcRoute = trpcLoggedProcedure
  .input(zGetUserFollowsTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }
    const meId = ctx.me.id;

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

    const isFollowersList = input.type === "followers";

    const rawItems = await ctx.prisma.userFollow.findMany({
      where: isFollowersList
        ? {
            followingId: input.userId,
          }
        : {
            followerId: input.userId,
          },
      take: input.limit + 1,
      ...(input.cursor
        ? {
            cursor: {
              seq: input.cursor,
            },
            skip: 1,
          }
        : {}),
      orderBy: {
        seq: "desc",
      },
      select: isFollowersList
        ? {
            seq: true,
            follower: {
              select: {
                id: true,
                nickname: true,
                name: true,
                avatar: true,
              },
            },
          }
        : {
            seq: true,
            following: {
              select: {
                id: true,
                nickname: true,
                name: true,
                avatar: true,
              },
            },
          },
    });

    let nextCursor: number | null = null;
    if (rawItems.length > input.limit) {
      rawItems.pop();
      nextCursor = rawItems[rawItems.length - 1]?.seq ?? null;
    }

    const users = rawItems.map((item) =>
      isFollowersList ? item.follower : item.following,
    );

    const userIds = users
      .map((user) => user.id)
      .filter((userId) => userId !== meId);

    const followsByMe =
      userIds.length > 0
        ? await ctx.prisma.userFollow.findMany({
            where: {
              followerId: meId,
              followingId: {
                in: userIds,
              },
            },
            select: {
              followingId: true,
            },
          })
        : [];

    const followsByMeSet = new Set(
      followsByMe.map((follow) => follow.followingId),
    );

    return {
      users: users.map((user) => ({
        ...user,
        isFollowedByMe: followsByMeSet.has(user.id),
      })),
      nextCursor,
    };
  });
