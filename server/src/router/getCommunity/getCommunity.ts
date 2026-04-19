import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetCommunityTrpcInput } from "./input";

export const getCommunityTrpcRoute = trpcLoggedProcedure
  .input(zGetCommunityTrpcInput)
  .query(async ({ ctx, input }) => {
    const community = await ctx.prisma.community.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            posts: {
              where: {
                deletedAt: null,
                publisherType: "COMMUNITY",
              },
            },
          },
        },
      },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    const meMember = ctx.me
      ? await ctx.prisma.communityMember.findUnique({
          where: {
            communityId_userId: {
              communityId: input.id,
              userId: ctx.me.id,
            },
          },
          select: {
            role: true,
          },
        })
      : null;
    const isSubscribedByMe = ctx.me
      ? !!(await ctx.prisma.communitySubscription.findUnique({
          where: {
            communityId_userId: {
              communityId: input.id,
              userId: ctx.me.id,
            },
          },
          select: {
            id: true,
          },
        })) ||
        meMember?.role === "OWNER" ||
        meMember?.role === "MODERATOR"
      : false;

    return {
      community: {
        ...community,
        membersCount: community._count.subscriptions,
        postsCount: community._count.posts,
        myRole: meMember?.role ?? null,
        isSubscribedByMe,
      },
    };
  });
