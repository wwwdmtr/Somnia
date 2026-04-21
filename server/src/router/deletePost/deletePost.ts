import { createCommunityActionLog } from "../../lib/communityModeration";
import { sendPostBlockedEmail } from "../../lib/emails";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { canDeleteThisPost, isPostOwner } from "../../utils/can";
import {
  destroyPostImages,
  getUnreferencedPostImagePublicIds,
} from "../../utils/postImages";

import { zDeletePostTrpcInput } from "./input";

export const deletePostTrpcRoute = trpcLoggedProcedure
  .input(zDeletePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { postId } = input;

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        publisherType: true,
        publisherCommunityId: true,
        deletedAt: true,
        title: true,
        images: true,
        author: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!post || post.deletedAt) {
      throw new ExpectedError("Post not found");
    }

    let canManageCommunityPost = false;
    if (
      !canDeleteThisPost(ctx.me, post) &&
      post.publisherType === "COMMUNITY" &&
      post.publisherCommunityId &&
      ctx.me?.id
    ) {
      const membership = await ctx.prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: post.publisherCommunityId,
            userId: ctx.me.id,
          },
        },
        select: {
          role: true,
        },
      });

      canManageCommunityPost =
        membership?.role === "OWNER" || membership?.role === "MODERATOR";
    }

    if (!canDeleteThisPost(ctx.me, post) && !canManageCommunityPost) {
      throw new Error("Unauthorized");
    }

    await ctx.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    if (post.publisherType === "COMMUNITY" && post.publisherCommunityId) {
      await createCommunityActionLog({
        prisma: ctx.prisma,
        communityId: post.publisherCommunityId,
        actionType: "POST_DELETED",
        actorUserId: ctx.me?.id ?? null,
        postId,
      });
    }

    const orphanedImagePublicIds = await getUnreferencedPostImagePublicIds({
      prisma: ctx.prisma,
      imagePublicIds: post.images,
      excludePostId: postId,
    });

    await destroyPostImages({
      imagePublicIds: orphanedImagePublicIds,
      logContext: {
        postId,
        actorUserId: ctx.me?.id ?? null,
        action: "deletePost",
      },
    });

    if (!isPostOwner(ctx.me, post)) {
      void sendPostBlockedEmail({ user: post.author, post });
    }

    return true;
  });
