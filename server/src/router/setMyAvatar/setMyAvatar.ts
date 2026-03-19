import { v2 as cloudinary } from "cloudinary";

import { env } from "../../lib/env";
import { logger } from "../../lib/logger";
import { toClientMe } from "../../lib/models";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSetMyAvatarTrpcInput } from "./input";

const destroyAvatarInCloudinary = async (avatarPublicId: string) => {
  if (
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET ||
    !env.CLOUDINARY_CLOUD_NAME
  ) {
    logger.error(
      "cloudinary:destroyAvatar:missingCredentials",
      new Error("Cloudinary credentials are missing"),
      { avatarPublicId },
    );
    return;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  await cloudinary.uploader.destroy(avatarPublicId, {
    resource_type: "image",
    invalidate: true,
  });
};

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
      try {
        await destroyAvatarInCloudinary(previousAvatar);
      } catch (error) {
        logger.error("cloudinary:destroyAvatar:failed", error, {
          userId: ctx.me.id,
          avatarPublicId: previousAvatar,
        });
      }
    }

    return toClientMe(updatedMe);
  });
