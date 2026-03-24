import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import { TRPCClientError } from "@trpc/client";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { sentryCaptureException } from "../../lib/sentrySDK";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

type CloudinaryUploadResponse = {
  public_id?: string;
  error?: {
    message?: string;
  };
};

type PickedPostImageFile =
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

const MAX_POST_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_POST_IMAGES_COUNT = 10;

const pickImageFilesOnWeb = () =>
  new Promise<File[]>((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;

    input.onchange = () => {
      resolve(Array.from(input.files ?? []));
      input.remove();
    };

    input.click();
  });

const pickImageFilesOnNative = async (): Promise<PickedPostImageFile[]> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Media library permission is not granted");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 0.9,
    allowsMultipleSelection: true,
    selectionLimit: MAX_POST_IMAGES_COUNT,
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets.map((asset) => ({
    kind: "native" as const,
    uri: asset.uri,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.fileSize,
    type: asset.mimeType || "image/jpeg",
  }));
};

const pickPostImageFiles = async (): Promise<PickedPostImageFile[]> => {
  if (Platform.OS === "web") {
    const files = await pickImageFilesOnWeb();
    return files.map((file) => ({
      kind: "web" as const,
      file,
      size: file.size,
      type: file.type,
    }));
  }

  return pickImageFilesOnNative();
};

type PostImagesUploaderProps = {
  images: string[];
  disabled?: boolean;
  onChange: (images: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
};

export const PostImagesUploader = ({
  images,
  disabled,
  onChange,
  onUploadingChange,
}: PostImagesUploaderProps) => {
  const prepareCloudinaryUpload = trpc.prepareCloudinaryUpload.useMutation();
  const [errorMessage, setErrorMessage] = useState("");
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);

  const isBusy =
    disabled || prepareCloudinaryUpload.isPending || isUploadingToCloudinary;
  const canAddMore = images.length < MAX_POST_IMAGES_COUNT;
  const slotsLeft = MAX_POST_IMAGES_COUNT - images.length;

  const setUploadingState = (value: boolean) => {
    setIsUploadingToCloudinary(value);
    onUploadingChange?.(value);
  };

  const handlePickAndUpload = async () => {
    setErrorMessage("");

    const files = await pickPostImageFiles();
    if (!files.length) {
      return;
    }

    if (!canAddMore) {
      setErrorMessage("Можно прикрепить не больше 10 изображений");
      return;
    }

    const filesToUpload = files.slice(0, slotsLeft);

    const invalidType = filesToUpload.find(
      (file) => !file.type.startsWith("image/"),
    );
    if (invalidType) {
      setErrorMessage("Можно загрузить только изображения");
      return;
    }

    const tooLargeFile = filesToUpload.find(
      (file) => (file.size ?? 0) > MAX_POST_IMAGE_SIZE_BYTES,
    );
    if (tooLargeFile) {
      setErrorMessage("Размер каждого изображения должен быть не больше 10MB");
      return;
    }

    try {
      const { preparedData } = await prepareCloudinaryUpload.mutateAsync({
        type: "image",
      });

      setUploadingState(true);
      const uploadedPublicIds: string[] = [];

      for (const file of filesToUpload) {
        const formData = new FormData();
        if (file.kind === "web") {
          formData.append("file", file.file);
        } else {
          const fileName =
            file.fileName ||
            `post-image.${(file.mimeType || "image/jpeg").split("/")[1] || "jpg"}`;
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

        uploadedPublicIds.push(uploadResult.public_id);
      }

      onChange([...images, ...uploadedPublicIds]);
      if (files.length > filesToUpload.length) {
        setErrorMessage("Лимит 10 изображений, лишние файлы пропущены");
      }
    } catch (error) {
      if (!(error instanceof TRPCClientError)) {
        sentryCaptureException(error);
      }
      if (error instanceof Error && error.message.includes("permission")) {
        setErrorMessage("Нужен доступ к галерее для выбора изображений");
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Не удалось загрузить изображения");
      }
    } finally {
      setUploadingState(false);
    }
  };

  const handleRemoveImage = (imageIndex: number) => {
    setErrorMessage("");
    onChange(images.filter((_, index) => index !== imageIndex));
  };

  return (
    <View style={styles.container}>
      <Text style={typography.body_white85}>
        Изображения ({images.length}/{MAX_POST_IMAGES_COUNT})
      </Text>

      <AppButton
        title={isBusy ? "Загружаем..." : "Добавить изображения"}
        onPress={() => void handlePickAndUpload()}
        disabled={isBusy || !canAddMore}
        style={styles.addButton}
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {images.length > 0 ? (
        <View style={styles.previewGrid}>
          {images.map((imagePublicId, index) => (
            <View key={`${imagePublicId}-${index}`} style={styles.previewItem}>
              <Image
                source={{
                  uri: getCloudinaryUploadUrl(
                    imagePublicId,
                    "image",
                    "preview",
                  ),
                }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                disabled={isBusy}
                onPress={() => handleRemoveImage(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  addButton: {
    height: 40,
  },
  container: {
    gap: 10,
  },
  errorText: {
    color: COLORS.white85,
    fontSize: 12,
  },
  previewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  previewImage: {
    backgroundColor: COLORS.imageEmptyFieldsBackground,
    borderRadius: 12,
    height: 84,
    width: 84,
  },
  previewItem: {
    alignItems: "center",
    gap: 6,
  },
  removeButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeButtonText: {
    color: COLORS.white85,
    fontSize: 11,
  },
});
