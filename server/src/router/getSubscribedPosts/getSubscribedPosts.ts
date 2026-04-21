import _ from "lodash";

import {
  getBlockedCommunityIds,
  notifyExpiredCommunityBlacklistEntriesForUser,
} from "../../lib/communityModeration";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetSubscribedPostsTrpcInput } from "./input";

export const getSubscribedPostsTrpcRoute = trpcLoggedProcedure
  .input(zGetSubscribedPostsTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }
    await notifyExpiredCommunityBlacklistEntriesForUser({
      prisma: ctx.prisma,
      userId: ctx.me.id,
    });

    const managedCommunityIds = new Set<string>();
    let blockedCommunityIds = new Set<string>();

    const rawPosts = await ctx.prisma.post.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            publisherType: "COMMUNITY",
            publisherCommunity: {
              OR: [
                {
                  subscriptions: {
                    some: {
                      userId: ctx.me.id,
                    },
                  },
                },
                {
                  members: {
                    some: {
                      userId: ctx.me.id,
                      role: {
                        in: ["OWNER", "MODERATOR"],
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            publisherType: "USER",
            author: {
              followers: {
                some: {
                  followerId: ctx.me.id,
                },
              },
            },
          },
        ],
      },
      take: input.limit + 1,
      ...(input.cursor && {
        cursor: { seq: input.cursor },
        skip: 1,
      }),
      orderBy: {
        seq: "desc",
      },
      select: {
        id: true,
        seq: true,
        title: true,
        description: true,
        text: true,
        images: true,
        createdAt: true,
        publisherType: true,
        publisherCommunity: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            postLikes: true,
            comments: {
              where: { deletedAt: null },
            },
          },
        },
        postLikes: {
          where: {
            userId: ctx.me.id,
          },
          select: {
            id: true,
          },
        },
      },
    });

    let nextCursor: number | null = null;
    if (rawPosts.length > input.limit) {
      rawPosts.pop();
      nextCursor = rawPosts[rawPosts.length - 1]?.seq ?? null;
    }

    const communityIds = Array.from(
      new Set(
        rawPosts
          .map((post) => post.publisherCommunity?.id)
          .filter((communityId): communityId is string => Boolean(communityId)),
      ),
    );

    if (communityIds.length > 0) {
      const [memberships, blockedIds] = await Promise.all([
        ctx.prisma.communityMember.findMany({
          where: {
            userId: ctx.me.id,
            communityId: {
              in: communityIds,
            },
            role: {
              in: ["OWNER", "MODERATOR"],
            },
          },
          select: {
            communityId: true,
          },
        }),
        getBlockedCommunityIds({
          prisma: ctx.prisma,
          userId: ctx.me.id,
          communityIds,
        }),
      ]);

      memberships.forEach((membership) => {
        managedCommunityIds.add(membership.communityId);
      });

      blockedCommunityIds = blockedIds;
    }

    const posts = rawPosts
      .filter((post) => {
        if (
          post.publisherType !== "COMMUNITY" ||
          !post.publisherCommunity?.id
        ) {
          return true;
        }

        if (managedCommunityIds.has(post.publisherCommunity.id)) {
          return true;
        }

        return !blockedCommunityIds.has(post.publisherCommunity.id);
      })
      .map((post) => {
        const canSeeCommunityAuthor =
          post.publisherType !== "COMMUNITY" ||
          (!!post.publisherCommunity?.id &&
            managedCommunityIds.has(post.publisherCommunity.id));

        return {
          ..._.omit(post, ["_count", "postLikes", "author"]),
          ...(canSeeCommunityAuthor ? { author: post.author } : {}),
          likesCount: post._count.postLikes,
          commentsCount: post._count.comments,
          isLikedByMe: post.postLikes.length > 0,
        };
      });

    return { posts, nextCursor };
  });
