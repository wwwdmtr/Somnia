import { v2 as cloudinary } from "cloudinary";

import { env } from "./env";
import { logger } from "./logger";

let isCloudinaryConfigured = false;

const ensureCloudinaryConfigured = () => {
  if (isCloudinaryConfigured) {
    return true;
  }

  if (
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET ||
    !env.CLOUDINARY_CLOUD_NAME
  ) {
    logger.error(
      "cloudinary:missingCredentials",
      new Error("Cloudinary credentials are missing"),
    );
    return false;
  }

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  isCloudinaryConfigured = true;
  return true;
};

export const destroyCloudinaryImage = async ({
  publicId,
  logContext,
}: {
  publicId: string;
  logContext?: Record<string, unknown>;
}) => {
  if (!ensureCloudinaryConfigured()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    logger.error("cloudinary:destroyImage:failed", error, {
      publicId,
      ...(logContext ?? {}),
    });
  }
};
