import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
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
const PENDING_POST_IMAGE_IDS_KEY = "pending_post_image_ids";

const isWeb = Platform.OS === "web";

const normalizePendingPostImageIds = (imagePublicIds: string[]) =>
  Array.from(
    new Set(
      imagePublicIds
        .map((imagePublicId) =>
          typeof imagePublicId === "string" ? imagePublicId.trim() : "",
        )
        .filter(Boolean),
    ),
  );

const getPendingPostImageIdsFromWebStorage = () => {
  try {
    if (typeof window === "undefined") {
      return [] as string[];
    }

    const rawValue = window.localStorage.getItem(PENDING_POST_IMAGE_IDS_KEY);
    if (!rawValue) {
      return [] as string[];
    }

    const parsed = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsed)
      ? normalizePendingPostImageIds(
          parsed.filter((item): item is string => typeof item === "string"),
        )
      : [];
  } catch {
    return [] as string[];
  }
};

const setPendingPostImageIdsToWebStorage = (imagePublicIds: string[]) => {
  try {
    if (typeof window === "undefined") {
      return;
    }

    const normalized = normalizePendingPostImageIds(imagePublicIds);
    if (normalized.length === 0) {
      window.localStorage.removeItem(PENDING_POST_IMAGE_IDS_KEY);
      return;
    }

    window.localStorage.setItem(
      PENDING_POST_IMAGE_IDS_KEY,
      JSON.stringify(normalized),
    );
  } catch {
    // ignore storage errors
  }
};

const getPendingPostImageIdsFromNativeStorage = async () => {
  try {
    const rawValue = await SecureStore.getItemAsync(PENDING_POST_IMAGE_IDS_KEY);
    if (!rawValue) {
      return [] as string[];
    }

    const parsed = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsed)
      ? normalizePendingPostImageIds(
          parsed.filter((item): item is string => typeof item === "string"),
        )
      : [];
  } catch {
    return [] as string[];
  }
};

const setPendingPostImageIdsToNativeStorage = async (
  imagePublicIds: string[],
) => {
  const normalized = normalizePendingPostImageIds(imagePublicIds);
  if (normalized.length === 0) {
    await SecureStore.deleteItemAsync(PENDING_POST_IMAGE_IDS_KEY);
    return;
  }

  await SecureStore.setItemAsync(
    PENDING_POST_IMAGE_IDS_KEY,
    JSON.stringify(normalized),
  );
};

export const getPendingPostImagePublicIds = async () => {
  if (isWeb) {
    return getPendingPostImageIdsFromWebStorage();
  }

  return getPendingPostImageIdsFromNativeStorage();
};

export const addPendingPostImagePublicIds = async (
  imagePublicIds: string[],
) => {
  const currentIds = await getPendingPostImagePublicIds();
  const nextIds = normalizePendingPostImageIds([
    ...currentIds,
    ...imagePublicIds,
  ]);

  if (isWeb) {
    setPendingPostImageIdsToWebStorage(nextIds);
    return;
  }

  await setPendingPostImageIdsToNativeStorage(nextIds);
};

export const removePendingPostImagePublicIds = async (
  imagePublicIds: string[],
) => {
  const idsToRemove = new Set(normalizePendingPostImageIds(imagePublicIds));
  if (idsToRemove.size === 0) {
    return;
  }

  const currentIds = await getPendingPostImagePublicIds();
  const nextIds = currentIds.filter(
    (imagePublicId) => !idsToRemove.has(imagePublicId),
  );

  if (isWeb) {
    setPendingPostImageIdsToWebStorage(nextIds);
    return;
  }

  await setPendingPostImageIdsToNativeStorage(nextIds);
};

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
  onUploadedPublicId,
}: {
  files: PickedPostImageFile[];
  prepareCloudinaryUpload: () => Promise<{
    preparedData: CloudinaryPreparedData;
  }>;
  onUploadedPublicId?: (publicId: string) => void | Promise<void>;
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
    await onUploadedPublicId?.(uploadResult.public_id);
  }

  return uploadedPublicIds;
};
