export const getUserScopedUploadFolder = ({
  baseFolder,
  userId,
}: {
  baseFolder: string;
  userId: string;
}) => `${baseFolder}/users/${userId}`;

export const isCloudinaryPublicIdInFolder = ({
  publicId,
  folder,
}: {
  publicId: string;
  folder: string;
}) => publicId === folder || publicId.startsWith(`${folder}/`);

export const isAvatarOwnedByUser = ({
  avatarPublicId,
  userId,
}: {
  avatarPublicId: string;
  userId: string;
}) => {
  const userAvatarFolder = getUserScopedUploadFolder({
    baseFolder: "avatars",
    userId,
  });

  return isCloudinaryPublicIdInFolder({
    publicId: avatarPublicId,
    folder: userAvatarFolder,
  });
};
