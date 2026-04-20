import { trpcLoggedProcedure } from "../../lib/trpc";
import { isPostOwner } from "../../utils/can";

import { zUpdatePostTrpcInput } from "./input";

export const updatePostTrpcRoute = trpcLoggedProcedure
  .input(zUpdatePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { postId, title, description, text, images } = input;
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        publisherType: true,
        publisherCommunityId: true,
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const isAuthor = isPostOwner(ctx.me, post);
    let canManageCommunityPost = false;

    if (!isAuthor && post.publisherType === "COMMUNITY") {
      if (!post.publisherCommunityId) {
        throw new Error("Post community is missing");
      }

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

    if (!isAuthor && !canManageCommunityPost) {
      throw new Error("Unauthorized");
    }

    await ctx.prisma.post.update({
      where: { id: postId },
      data: {
        title,
        description,
        text,
        images,
      },
    });
    return true;
  });
