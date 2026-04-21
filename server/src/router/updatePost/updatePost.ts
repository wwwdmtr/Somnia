import { createCommunityActionLog } from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { isPostOwner } from "../../utils/can";
import {
  destroyPostImages,
  getUnreferencedPostImagePublicIds,
  isPostImageOwnedByUser,
} from "../../utils/postImages";

import { zUpdatePostTrpcInput } from "./input";

export const updatePostTrpcRoute = trpcLoggedProcedure
  .input(zUpdatePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { postId, title, description, text, images } = input;
    const me = ctx.me;
    if (!me) {
      throw new Error("Unauthorized");
    }

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const normalizedText = text.trim();
    const normalizedImages = Array.from(
      new Set(images.map((imagePublicId) => imagePublicId.trim())),
    );
    const hasAnyContent =
      normalizedTitle.length > 0 ||
      normalizedText.length > 0 ||
      normalizedImages.length > 0;

    if (!hasAnyContent) {
      throw new ExpectedError(
        "Добавьте заголовок, текст или хотя бы одно изображение",
      );
    }

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        publisherType: true,
        publisherCommunityId: true,
        images: true,
      },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const isAuthor = isPostOwner(me, post);
    let canManageCommunityPost = false;

    if (!isAuthor && post.publisherType === "COMMUNITY") {
      if (!post.publisherCommunityId) {
        throw new Error("Post community is missing");
      }

      const membership = await ctx.prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: post.publisherCommunityId,
            userId: me.id,
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

    const previousImagesSet = new Set(post.images);

    const newlyAddedImages = normalizedImages.filter(
      (imagePublicId) => !previousImagesSet.has(imagePublicId),
    );

    const hasForeignNewImage = newlyAddedImages.some(
      (imagePublicId) =>
        !isPostImageOwnedByUser({
          imagePublicId,
          userId: me.id,
        }),
    );

    if (hasForeignNewImage) {
      throw new Error("Некорректный идентификатор изображения");
    }

    const nextImagesSet = new Set(normalizedImages);
    const removedImagePublicIds = post.images.filter(
      (imagePublicId) => !nextImagesSet.has(imagePublicId),
    );

    await ctx.prisma.post.update({
      where: { id: postId },
      data: {
        title: normalizedTitle,
        description: normalizedDescription,
        text: normalizedText,
        images: normalizedImages,
      },
    });

    if (post.publisherType === "COMMUNITY" && post.publisherCommunityId) {
      await createCommunityActionLog({
        prisma: ctx.prisma,
        communityId: post.publisherCommunityId,
        actionType: "POST_UPDATED",
        actorUserId: me.id,
        postId,
      });
    }

    const orphanedImagePublicIds = await getUnreferencedPostImagePublicIds({
      prisma: ctx.prisma,
      imagePublicIds: removedImagePublicIds,
      excludePostId: postId,
    });

    await destroyPostImages({
      imagePublicIds: orphanedImagePublicIds,
      logContext: {
        postId,
        actorUserId: me.id,
        action: "updatePost",
      },
    });

    return true;
  });
