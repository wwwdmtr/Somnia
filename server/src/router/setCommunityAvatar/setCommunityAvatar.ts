import { destroyCloudinaryImage } from "../../lib/cloudinary";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSetCommunityAvatarTrpcInput } from "./input";

export const setCommunityAvatarTrpcRoute = trpcLoggedProcedure
  .input(zSetCommunityAvatarTrpcInput)
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

    const updatedCommunity = await ctx.prisma.community.update({
      where: {
        id: input.communityId,
      },
      data: {
        avatar: input.avatar,
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
      },
    });

    if (community.avatar && community.avatar !== input.avatar) {
      await destroyCloudinaryImage({
        publicId: community.avatar,
        logContext: {
          communityId: input.communityId,
          ownerId: ctx.me.id,
        },
      });
    }

    return {
      community: updatedCommunity,
    };
  });
