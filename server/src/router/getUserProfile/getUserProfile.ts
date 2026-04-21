import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { hasUserBlockRelation } from "../../lib/userContentBlock";

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

    if (ctx.me && !isMe) {
      const blocked = await hasUserBlockRelation({
        prisma: ctx.prisma,
        firstUserId: ctx.me.id,
        secondUserId: user.id,
      });

      if (blocked) {
        throw new ExpectedError("Профиль пользователя недоступен");
      }
    }

    const [isFollowedByMe, isBlockedByMe] =
      !isMe && ctx.me
        ? await Promise.all([
            ctx.prisma.userFollow.findUnique({
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
            ctx.prisma.userBlockedUser.findUnique({
              where: {
                userId_blockedUserId: {
                  userId: ctx.me.id,
                  blockedUserId: user.id,
                },
              },
              select: {
                id: true,
              },
            }),
          ])
        : [null, null];

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
        isFollowedByMe: Boolean(isFollowedByMe),
        isBlockedByMe: Boolean(isBlockedByMe),
        canReportByMe: Boolean(ctx.me) && !isMe,
      },
    };
  });
