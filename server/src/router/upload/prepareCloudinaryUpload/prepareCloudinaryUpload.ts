import { cloudinaryUploadTypes } from "@somnia/shared/dist/cloudinary/cloudinary";
import { v2 as cloudinary } from "cloudinary";

import { env } from "../../../lib/env";
import { trpcLoggedProcedure } from "../../../lib/trpc";
import { getUserScopedUploadFolder } from "../../../utils/cloudinaryPublicId";

import { zPrepareCloudinaryUploadTrpcInput } from "./input";

export const prepareCloudinaryUploadTrpcRoute = trpcLoggedProcedure
  .input(zPrepareCloudinaryUploadTrpcInput)
  .mutation(async ({ input, ctx }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    if (!env.CLOUDINARY_API_SECRET) {
      throw new Error("CLOUDINARY_API_SECRET is missing");
    }
    if (!env.CLOUDINARY_API_KEY) {
      throw new Error("CLOUDINARY_API_KEY is missing");
    }
    const uploadType = cloudinaryUploadTypes[input.type];
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = getUserScopedUploadFolder({
      baseFolder: uploadType.folder,
      userId: ctx.me.id,
    });
    const transformation = uploadType.transformation;
    const eager = Object.values(uploadType.presets).join("|");
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        transformation,
        eager,
      },
      env.CLOUDINARY_API_SECRET,
    );
    return {
      preparedData: {
        timestamp: `${timestamp}`,
        folder,
        transformation,
        eager,
        signature,
        apiKey: env.CLOUDINARY_API_KEY,
        url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/auto/upload`,
      },
    };
  });
