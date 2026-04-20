import { TRPCClientError } from "@trpc/client";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

import { getAvatarSource } from "../../lib/avatar";
import { useMe } from "../../lib/ctx";
import { sentryCaptureException } from "../../lib/sentrySDK";
import { trpc } from "../../lib/trpc";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

type CloudinaryUploadResponse = {
  public_id?: string;
  error?: {
    message?: string;
  };
};

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

const pickImageFileOnWeb = () =>
  new Promise<File | null>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      resolve(input.files?.[0] ?? null);
      input.remove();
    };

    input.click();
  });

type PickedAvatarFile =
  | {
      kind: "web";
      file: File;
      size: number;
      type: string;
    }
  | {
      kind: "native";
      uri: string;
      fileName?: string | null;
      mimeType?: string | null;
      size?: number | null;
      type: string;
    };

const pickImageFileOnNative = async (): Promise<PickedAvatarFile | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Media library permission is not granted");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  const fileType = asset.mimeType || "image/jpeg";

  return {
    kind: "native",
    uri: asset.uri,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.fileSize,
    type: fileType,
  };
};

const pickAvatarFile = async (): Promise<PickedAvatarFile | null> => {
  if (Platform.OS === "web") {
    const file = await pickImageFileOnWeb();
    if (!file) {
      return null;
    }

    return {
      kind: "web",
      file,
      size: file.size,
      type: file.type,
    };
  }

  return pickImageFileOnNative();
};

export const AvatarUploader = () => {
  const me = useMe();
  const trpcUtils = trpc.useUtils();

  const prepareCloudinaryUpload = trpc.prepareCloudinaryUpload.useMutation();
  const setMyAvatar = trpc.setMyAvatar.useMutation();

  const [errorMessage, setErrorMessage] = useState("");
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);

  const isBusy =
    prepareCloudinaryUpload.isPending ||
    setMyAvatar.isPending ||
    isUploadingToCloudinary;
  if (!me) {
    return (
      <View style={styles.container}>
        <Text>Вы не авторизованы</Text>
      </View>
    );
  }

  const setMeCache = (updatedMe: typeof me) => {
    trpcUtils.getMe.setData(undefined, { me: updatedMe });
  };

  const handleRemoveAvatar = async () => {
    setErrorMessage("");
    try {
      const updatedMe = await setMyAvatar.mutateAsync({ avatar: null });
      setMeCache(updatedMe);
    } catch (error) {
      if (!(error instanceof TRPCClientError)) {
        sentryCaptureException(error);
      }
      setErrorMessage("Не удалось удалить аватарку");
    }
  };

  const handleUploadAvatar = async () => {
    setErrorMessage("");

    const file = await pickAvatarFile();
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Можно загрузить только изображение");
      return;
    }
    if ((file.size ?? 0) > MAX_AVATAR_SIZE_BYTES) {
      setErrorMessage("Размер аватарки должен быть не больше 5MB");
      return;
    }

    try {
      const { preparedData } = await prepareCloudinaryUpload.mutateAsync({
        type: "avatar",
      });
      const formData = new FormData();
      if (file.kind === "web") {
        formData.append("file", file.file);
      } else {
        const fileName =
          file.fileName ||
          `avatar.${(file.mimeType || "image/jpeg").split("/")[1] || "jpg"}`;
        formData.append("file", {
          uri: file.uri,
          name: fileName,
          type: file.mimeType || "image/jpeg",
        } as unknown as Blob);
      }
      formData.append("api_key", preparedData.apiKey);
      formData.append("timestamp", preparedData.timestamp);
      formData.append("folder", preparedData.folder);
      formData.append("transformation", preparedData.transformation);
      formData.append("eager", preparedData.eager);
      formData.append("signature", preparedData.signature);

      setIsUploadingToCloudinary(true);
      const uploadResponse = await fetch(preparedData.url, {
        method: "POST",
        body: formData,
      });
      const uploadResult = (await uploadResponse
        .json()
        .catch(() => ({}))) as CloudinaryUploadResponse;

      if (!uploadResponse.ok) {
        throw new Error(
          uploadResult.error?.message || "Cloudinary upload failed",
        );
      }

      if (!uploadResult.public_id) {
        throw new Error("Cloudinary did not return public_id");
      }

      const updatedMe = await setMyAvatar.mutateAsync({
        avatar: uploadResult.public_id,
      });
      setMeCache(updatedMe);
    } catch (error) {
      if (!(error instanceof TRPCClientError)) {
        sentryCaptureException(error);
      }
      if (error instanceof Error && error.message.includes("permission")) {
        setErrorMessage("Нужен доступ к галерее для выбора аватарки");
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Не удалось обновить аватарку");
      }
    } finally {
      setIsUploadingToCloudinary(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={getAvatarSource(me.avatar, "big")} style={styles.avatar} />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <AppButton
        title={isBusy ? "Сохраняем..." : "Загрузить аватарку"}
        onPress={() => void handleUploadAvatar()}
        disabled={isBusy}
        style={styles.actionButton}
      />
      <AppButton
        title={isBusy ? "Сохраняем..." : "Удалить аватарку"}
        onPress={() => void handleRemoveAvatar()}
        disabled={isBusy || !me.avatar}
        style={styles.actionButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    height: 40,
  },
  avatar: {
    alignSelf: "center",
    borderColor: COLORS.white25,
    borderRadius: 50,
    borderWidth: 1,
    height: 100,
    width: 100,
  },
  container: {
    gap: 12,
  },
  errorText: {
    color: COLORS.white85,
    fontSize: 12,
  },
});
