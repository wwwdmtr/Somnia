import _ from "lodash";

import { getBlockedCommunityIds } from "../../lib/communityModeration";
import { trpcLoggedProcedure } from "../../lib/trpc";
import {
  getUsersWhoBlockedUserIds,
  getUserBlockedCommunityIds,
  getUserBlockedUserIds,
} from "../../lib/userContentBlock";

import { zGetRatedPostsTrpcInput } from "./input";

export const getRatedPostsTrpcRoute = trpcLoggedProcedure
  .input(zGetRatedPostsTrpcInput)
  .query(async ({ ctx, input }) => {
    const userId = ctx.me?.id;
    const managedCommunityIds = new Set<string>();
    let blockedCommunityIdsByCommunity = new Set<string>();
    let blockedCommunityIdsByMe = new Set<string>();
    let blockedUserIdsByMe = new Set<string>();
    let blockedUserIdsByThem = new Set<string>();

    let dateFrom: Date | undefined;

    if (input.period) {
      const now = new Date();

      switch (input.period) {
        case "day":
          dateFrom = new Date(now.setDate(now.getDate() - 1));
          break;
        case "week":
          dateFrom = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          dateFrom = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "all":
        default:
          dateFrom = undefined;
          break;
      }
    }

    const rawSearch = input.search?.trim();
    const normalizedSearch = rawSearch
      ? rawSearch.replace(/\s+/g, " & ")
      : undefined;

    const shouldUseFts =
      !!rawSearch && rawSearch.length >= 3 && !/^\d+$/.test(rawSearch);

    const where = {
      deletedAt: null,
      ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),

      ...(rawSearch
        ? {
            OR: [
              { title: { contains: rawSearch, mode: "insensitive" as const } },
              {
                description: {
                  contains: rawSearch,
                  mode: "insensitive" as const,
                },
              },
              { text: { contains: rawSearch, mode: "insensitive" as const } },

              ...(shouldUseFts
                ? ([
                    { title: { search: normalizedSearch! } },
                    { description: { search: normalizedSearch! } },
                    { text: { search: normalizedSearch! } },
                  ] as const)
                : []),
            ],
          }
        : {}),
    };

    const rawPosts = await ctx.prisma.post.findMany({
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { seq: input.cursor }, skip: 1 } : {}),

      where,

      orderBy: {
        postLikes: {
          _count: "desc",
        },
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
            isVerified: true,
          },
        },

        author: {
          select: { id: true, nickname: true, avatar: true },
        },

        _count: {
          select: {
            postLikes: true,
            comments: {
              where: { deletedAt: null },
            },
          },
        },

        ...(userId
          ? {
              postLikes: {
                where: { userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    let nextCursor: number | null = null;
    if (rawPosts.length > input.limit) {
      rawPosts.pop();
      nextCursor = rawPosts[rawPosts.length - 1]?.seq ?? null;
    }

    if (userId) {
      const authorIds = Array.from(
        new Set(
          rawPosts
            .map((post) => post.author.id)
            .filter((authorId): authorId is string => Boolean(authorId)),
        ),
      );
      const communityIds = Array.from(
        new Set(
          rawPosts
            .map((post) => post.publisherCommunity?.id)
            .filter((communityId): communityId is string =>
              Boolean(communityId),
            ),
        ),
      );

      const [
        memberships,
        blockedByCommunity,
        blockedByMe,
        blockedUsersByMe,
        blockedUsersByThem,
      ] = await Promise.all([
        communityIds.length > 0
          ? ctx.prisma.communityMember.findMany({
              where: {
                userId,
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
            })
          : [],
        getBlockedCommunityIds({
          prisma: ctx.prisma,
          userId,
          communityIds,
        }),
        getUserBlockedCommunityIds({
          prisma: ctx.prisma,
          userId,
          communityIds,
        }),
        getUserBlockedUserIds({
          prisma: ctx.prisma,
          userId,
          targetUserIds: authorIds,
        }),
        getUsersWhoBlockedUserIds({
          prisma: ctx.prisma,
          userId,
          targetUserIds: authorIds,
        }),
      ]);

      memberships.forEach((membership) => {
        managedCommunityIds.add(membership.communityId);
      });

      blockedCommunityIdsByCommunity = blockedByCommunity;
      blockedCommunityIdsByMe = blockedByMe;
      blockedUserIdsByMe = blockedUsersByMe;
      blockedUserIdsByThem = blockedUsersByThem;
    }

    const posts = rawPosts
      .filter((post) => {
        const isUserPost = post.publisherType === "USER";
        if (
          isUserPost &&
          (blockedUserIdsByMe.has(post.author.id) ||
            blockedUserIdsByThem.has(post.author.id))
        ) {
          return false;
        }

        if (
          post.publisherType !== "COMMUNITY" ||
          !post.publisherCommunity?.id
        ) {
          return true;
        }

        if (managedCommunityIds.has(post.publisherCommunity.id)) {
          return true;
        }

        return (
          !blockedCommunityIdsByCommunity.has(post.publisherCommunity.id) &&
          !blockedCommunityIdsByMe.has(post.publisherCommunity.id)
        );
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
          isLikedByMe: userId ? post.postLikes.length > 0 : false,
        };
      });

    return { posts, nextCursor };
  });
