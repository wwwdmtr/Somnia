import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { isPostImageOwnedByUser } from "../../utils/postImages";

import { zCreatePostTrpcInput } from "./input";

export const createPostTrpcRoute = trpcLoggedProcedure
  .input(zCreatePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const me = ctx.me;
    if (!me) {
      throw new Error("Unauthorized");
    }

    const normalizedImages = Array.from(
      new Set(input.images.map((imagePublicId) => imagePublicId.trim())),
    );
    const hasForeignImage = normalizedImages.some(
      (imagePublicId) =>
        !isPostImageOwnedByUser({
          imagePublicId,
          userId: me.id,
        }),
    );

    if (hasForeignImage) {
      throw new ExpectedError("Некорректный идентификатор изображения");
    }

    const communityId = input.communityId?.trim();
    let publisherType: "USER" | "COMMUNITY" = "USER";

    if (communityId) {
      const membership = await ctx.prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId,
            userId: me.id,
          },
        },
        select: {
          role: true,
        },
      });

      if (!membership || !["OWNER", "MODERATOR"].includes(membership.role)) {
        throw new Error("Unauthorized");
      }

      publisherType = "COMMUNITY";
    }

    const post = await ctx.prisma.post.create({
      data: {
        title: input.title,
        description: input.description,
        text: input.text,
        images: normalizedImages,
        author: { connect: { id: me.id } },
        publisherType,
        ...(communityId
          ? {
              publisherCommunity: {
                connect: {
                  id: communityId,
                },
              },
            }
          : {}),
      },
    });

    return post;
  });
