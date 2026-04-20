import { destroyCloudinaryImage } from "../../lib/cloudinary";
import { toClientMe } from "../../lib/models";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSetMyAvatarTrpcInput } from "./input";

export const setMyAvatarTrpcRoute = trpcLoggedProcedure
  .input(zSetMyAvatarTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("UNAUTHORIZED");
    }

    const previousAvatar = ctx.me.avatar;
    const nextAvatar = input.avatar;

    const updatedMe = await ctx.prisma.user.update({
      where: {
        id: ctx.me.id,
      },
      data: {
        avatar: nextAvatar,
      },
    });

    ctx.me = updatedMe;

    if (previousAvatar && previousAvatar !== nextAvatar) {
      await destroyCloudinaryImage({
        publicId: previousAvatar,
        logContext: {
          userId: ctx.me.id,
        },
      });
    }

    return toClientMe(updatedMe);
  });
