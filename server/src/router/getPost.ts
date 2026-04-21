import _ from "lodash";
import { z } from "zod";

import {
  getActiveCommunityBlacklistEntry,
  getCommunityMembershipRole,
  isCommunityManagerRole,
} from "../lib/communityModeration";
import { ExpectedError } from "../lib/error";
import { trpcLoggedProcedure } from "../lib/trpc";
import { canDeleteThisPost, isPostOwner, isUserAdmin } from "../utils/can";

export const getPostTrpcRoute = trpcLoggedProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const userId = ctx.me?.id;
    const rawPost = await ctx.prisma.post.findUnique({
      where: { id: input.id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        publisherCommunity: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        ...(userId
          ? {
              postLikes: {
                select: {
                  id: true,
                },
                where: {
                  userId,
                },
              },
            }
          : {}),
        _count: {
          select: { postLikes: true },
        },
      },
    });

    if (rawPost?.deletedAt && !isUserAdmin(ctx.me)) {
      throw new ExpectedError("Пост был удален");
    }

    let canManageCommunityPost = false;
    if (
      rawPost &&
      userId &&
      rawPost.publisherType === "COMMUNITY" &&
      rawPost.publisherCommunityId
    ) {
      const role = await getCommunityMembershipRole({
        prisma: ctx.prisma,
        communityId: rawPost.publisherCommunityId,
        userId,
      });

      canManageCommunityPost = isCommunityManagerRole(role);

      if (!canManageCommunityPost) {
        const blacklistEntry = await getActiveCommunityBlacklistEntry({
          prisma: ctx.prisma,
          communityId: rawPost.publisherCommunityId,
          userId,
        });

        if (blacklistEntry) {
          throw new ExpectedError("Пост сообщества недоступен");
        }
      }
    }

    let isAuthorBlockedByMe = false;
    let isPublisherCommunityBlockedByMe = false;
    let canBlockCommunityByMe = false;
    let canReportByMe = false;

    if (rawPost && userId) {
      const [authorBlocked, communityBlocked] = await Promise.all([
        rawPost.authorId !== userId
          ? ctx.prisma.userBlockedUser.findUnique({
              where: {
                userId_blockedUserId: {
                  userId,
                  blockedUserId: rawPost.authorId,
                },
              },
              select: {
                id: true,
              },
            })
          : null,
        rawPost.publisherType === "COMMUNITY" && rawPost.publisherCommunityId
          ? ctx.prisma.userBlockedCommunity.findUnique({
              where: {
                userId_communityId: {
                  userId,
                  communityId: rawPost.publisherCommunityId,
                },
              },
              select: {
                id: true,
              },
            })
          : null,
      ]);

      isAuthorBlockedByMe = Boolean(authorBlocked);
      isPublisherCommunityBlockedByMe = Boolean(communityBlocked);
      canBlockCommunityByMe =
        rawPost.publisherType === "COMMUNITY" &&
        Boolean(rawPost.publisherCommunityId) &&
        !canManageCommunityPost;
      canReportByMe =
        rawPost.authorId !== userId &&
        !(rawPost.publisherType === "COMMUNITY" && canManageCommunityPost);
    }

    const isLikedByMe = userId ? !!rawPost?.postLikes.length : false;
    const likesCount = rawPost?._count.postLikes || 0;
    const canEditByMe =
      !!rawPost && (isPostOwner(ctx.me, rawPost) || canManageCommunityPost);
    const canDeleteByMe =
      !!rawPost &&
      (canDeleteThisPost(ctx.me, rawPost) || canManageCommunityPost);
    const canSeeCommunityAuthor =
      !!rawPost &&
      (rawPost.publisherType !== "COMMUNITY" || canManageCommunityPost);
    const post = rawPost && {
      ..._.omit(rawPost, ["postLikes", "_count", "author"]),
      ...(canSeeCommunityAuthor ? { author: rawPost.author } : {}),
      likesCount,
      isLikedByMe,
      canEditByMe,
      canDeleteByMe,
      canReportByMe,
      canBlockCommunityByMe,
      isAuthorBlockedByMe,
      isPublisherCommunityBlockedByMe,
    };

    return { post };
  });
