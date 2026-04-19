import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetUserProfileTrpcInput } from "./input";

export const getUserProfileTrpcRoute = trpcLoggedProcedure
  .input(zGetUserProfileTrpcInput)
  .query(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: {
        id: input.userId,
      },
      select: {
        id: true,
        nickname: true,
        name: true,
        avatar: true,
        _count: {
          select: {
            posts: {
              where: {
                deletedAt: null,
                publisherType: "USER",
              },
            },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new ExpectedError("Пользователь не найден");
    }

    const isMe = ctx.me?.id === user.id;

    const isFollowedByMe =
      !isMe && ctx.me
        ? Boolean(
            await ctx.prisma.userFollow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: ctx.me.id,
                  followingId: user.id,
                },
              },
              select: {
                id: true,
              },
            }),
          )
        : false;

    return {
      profile: {
        id: user.id,
        nickname: user.nickname,
        name: user.name,
        avatar: user.avatar,
        postsCount: user._count.posts,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        isMe,
        isFollowedByMe,
      },
    };
  });
