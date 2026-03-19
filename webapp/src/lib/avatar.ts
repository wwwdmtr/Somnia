/* eslint-disable @typescript-eslint/no-require-imports */
import { getAvatarUrl } from "@somnia/shared/src/cloudinary/cloudinary";

import type { ImageSourcePropType } from "react-native";

export const DEFAULT_AVATAR_SOURCE =
  require("../assets/defaults/user-avatar.png") as ImageSourcePropType;

export const getAvatarSource = (
  avatar: string | null | undefined,
  preset: "small" | "big" = "small",
): ImageSourcePropType => {
  if (!avatar) {
    return DEFAULT_AVATAR_SOURCE;
  }
  return {
    uri: getAvatarUrl(avatar, preset),
  };
};
