import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

type CloudinaryUploadResponse = {
  public_id?: string;
  error?: {
    message?: string;
  };
};

type CloudinaryPreparedData = {
  apiKey: string;
  timestamp: string;
  folder: string;
  transformation: string;
  eager: string;
  signature: string;
  url: string;
};

export type PickedPostImageFile =
  | {
      kind: "web";
      file: File;
      size: number;
      type: string;
      previewUri: string;
    }
  | {
      kind: "native";
      uri: string;
      fileName?: string | null;
      mimeType?: string | null;
      size?: number | null;
      type: string;
      previewUri: string;
    };

export const MAX_POST_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_POST_IMAGES_COUNT = 10;

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
    previewUri: asset.uri,
  }));
};

export const pickPostImageFiles = async (): Promise<PickedPostImageFile[]> => {
  if (Platform.OS === "web") {
    const files = await pickImageFilesOnWeb();
    return files.map((file) => ({
      kind: "web" as const,
      file,
      size: file.size,
      type: file.type,
      previewUri: URL.createObjectURL(file),
    }));
  }

  return pickImageFilesOnNative();
};

export const validatePostImageFiles = (
  files: PickedPostImageFile[],
): string | null => {
  const invalidType = files.find((file) => !file.type.startsWith("image/"));
  if (invalidType) {
    return "Можно загрузить только изображения";
  }

  const tooLargeFile = files.find(
    (file) => (file.size ?? 0) > MAX_POST_IMAGE_SIZE_BYTES,
  );
  if (tooLargeFile) {
    return "Размер каждого изображения должен быть не больше 10MB";
  }

  return null;
};

export const uploadPostImagesToCloudinary = async ({
  files,
  prepareCloudinaryUpload,
}: {
  files: PickedPostImageFile[];
  prepareCloudinaryUpload: () => Promise<{
    preparedData: CloudinaryPreparedData;
  }>;
}) => {
  if (files.length === 0) {
    return [] as string[];
  }

  const { preparedData } = await prepareCloudinaryUpload();
  const uploadedPublicIds: string[] = [];

  for (const file of files) {
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

  return uploadedPublicIds;
};
