import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  MAX_POST_IMAGES_COUNT,
  pickPostImageFiles,
  validatePostImageFiles,
  type PickedPostImageFile,
} from "../../lib/postImages";
import { COLORS, typography } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

type PostImagesUploaderProps = {
  uploadedImages: string[];
  pendingImages: PickedPostImageFile[];
  disabled?: boolean;
  onUploadedImagesChange: (images: string[]) => void;
  onPendingImagesChange: (images: PickedPostImageFile[]) => void;
};

export const PostImagesUploader = ({
  uploadedImages,
  pendingImages,
  disabled,
  onUploadedImagesChange,
  onPendingImagesChange,
}: PostImagesUploaderProps) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [isPicking, setIsPicking] = useState(false);

  const totalImagesCount = uploadedImages.length + pendingImages.length;
  const canAddMore = totalImagesCount < MAX_POST_IMAGES_COUNT;
  const slotsLeft = MAX_POST_IMAGES_COUNT - totalImagesCount;
  const isBusy = Boolean(disabled || isPicking);

  const handlePickImages = async () => {
    setErrorMessage("");
    try {
      setIsPicking(true);
      const files = await pickPostImageFiles();
      if (!files.length) {
        return;
      }
      if (!canAddMore) {
        setErrorMessage("Можно прикрепить не больше 10 изображений");
        return;
      }

      const filesToAdd = files.slice(0, slotsLeft);
      const validationError = validatePostImageFiles(filesToAdd);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      onPendingImagesChange([...pendingImages, ...filesToAdd]);
      if (files.length > filesToAdd.length) {
        setErrorMessage("Лимит 10 изображений, лишние файлы пропущены");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("permission")) {
        setErrorMessage("Нужен доступ к галерее для выбора изображений");
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Не удалось выбрать изображения");
      }
    } finally {
      setIsPicking(false);
    }
  };

  const removeUploadedImage = (imageIndex: number) => {
    setErrorMessage("");
    onUploadedImagesChange(
      uploadedImages.filter((_, index) => index !== imageIndex),
    );
  };

  const removePendingImage = (imageIndex: number) => {
    setErrorMessage("");
    onPendingImagesChange(
      pendingImages.filter((_, index) => index !== imageIndex),
    );
  };

  return (
    <View style={styles.container}>
      <Text style={typography.body_white85}>
        Изображения ({totalImagesCount}/{MAX_POST_IMAGES_COUNT})
      </Text>

      <AppButton
        title={isBusy ? "Обрабатываем..." : "Добавить изображения"}
        onPress={() => void handlePickImages()}
        disabled={isBusy || !canAddMore}
        style={styles.addButton}
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      {totalImagesCount > 0 ? (
        <View style={styles.previewGrid}>
          {uploadedImages.map((imagePublicId, index) => (
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
                onPress={() => removeUploadedImage(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Удалить</Text>
              </TouchableOpacity>
            </View>
          ))}

          {pendingImages.map((pendingImage, index) => (
            <View
              key={`${pendingImage.previewUri}-${index}`}
              style={styles.previewItem}
            >
              <Image
                source={{ uri: pendingImage.previewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                disabled={isBusy}
                onPress={() => removePendingImage(index)}
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
