import { destroyCloudinaryImage } from "../lib/cloudinary";

import {
  getUserScopedUploadFolder,
  isCloudinaryPublicIdInFolder,
} from "./cloudinaryPublicId";

export const isPostImagePublicId = (publicId: string) =>
  isCloudinaryPublicIdInFolder({
    publicId,
    folder: "images",
  });

export const isPostImageOwnedByUser = ({
  imagePublicId,
  userId,
}: {
  imagePublicId: string;
  userId: string;
}) => {
  const userImageFolder = getUserScopedUploadFolder({
    baseFolder: "images",
    userId,
  });

  return isCloudinaryPublicIdInFolder({
    publicId: imagePublicId,
    folder: userImageFolder,
  });
};

const unique = (items: string[]) => Array.from(new Set(items));

export const getUnreferencedPostImagePublicIds = async ({
  prisma,
  imagePublicIds,
  excludePostId,
}: {
  prisma: {
    post: {
      findMany: (args: {
        where: {
          deletedAt: null;
          id?: { not: string };
          images: { hasSome: string[] };
        };
        select: {
          images: true;
        };
      }) => Promise<Array<{ images: string[] }>>;
    };
  };
  imagePublicIds: string[];
  excludePostId?: string;
}) => {
  const normalizedImagePublicIds = unique(
    imagePublicIds.filter((imagePublicId) =>
      isPostImagePublicId(imagePublicId),
    ),
  );

  if (normalizedImagePublicIds.length === 0) {
    return [] as string[];
  }

  const postsWithReferencedImages = await prisma.post.findMany({
    where: {
      deletedAt: null,
      ...(excludePostId ? { id: { not: excludePostId } } : {}),
      images: {
        hasSome: normalizedImagePublicIds,
      },
    },
    select: {
      images: true,
    },
  });

  const referencedImageIds = new Set<string>();

  postsWithReferencedImages.forEach((post) => {
    post.images.forEach((imagePublicId) => {
      referencedImageIds.add(imagePublicId);
    });
  });

  return normalizedImagePublicIds.filter(
    (imagePublicId) => !referencedImageIds.has(imagePublicId),
  );
};

export const destroyPostImages = async ({
  imagePublicIds,
  logContext,
}: {
  imagePublicIds: string[];
  logContext?: Record<string, unknown>;
}) => {
  if (imagePublicIds.length === 0) {
    return;
  }

  await Promise.all(
    imagePublicIds.map((imagePublicId) =>
      destroyCloudinaryImage({
        publicId: imagePublicId,
        ...(logContext ? { logContext } : {}),
      }),
    ),
  );
};
