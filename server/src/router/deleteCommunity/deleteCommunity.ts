import { destroyCloudinaryImage } from "../../lib/cloudinary";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { isAvatarOwnedByUser } from "../../utils/cloudinaryPublicId";

import { zDeleteCommunityTrpcInput } from "./input";

export const deleteCommunityTrpcRoute = trpcLoggedProcedure
  .input(zDeleteCommunityTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const community = await ctx.prisma.community.findUnique({
      where: {
        id: input.communityId,
      },
      select: {
        id: true,
        ownerId: true,
        avatar: true,
      },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    if (community.ownerId !== ctx.me.id) {
      throw new Error("Unauthorized");
    }

    await ctx.prisma.$transaction([
      ctx.prisma.post.updateMany({
        where: {
          publisherType: "COMMUNITY",
          publisherCommunityId: input.communityId,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      }),
      ctx.prisma.community.delete({
        where: {
          id: input.communityId,
        },
      }),
    ]);

    if (
      community.avatar &&
      isAvatarOwnedByUser({
        avatarPublicId: community.avatar,
        userId: ctx.me.id,
      })
    ) {
      await destroyCloudinaryImage({
        publicId: community.avatar,
        logContext: {
          communityId: community.id,
          ownerId: ctx.me.id,
        },
      });
    }

    return {
      communityId: input.communityId,
    };
  });
