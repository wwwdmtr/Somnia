import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { zCreatePostTrpcInput } from "@somnia/shared/src/router/posts/createPost/input";
import { useFormik } from "formik";
import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { getErrorMessage, useAppFeedback } from "../../lib/appFeedback";
import { mixpanelTrackPostCreated } from "../../lib/mixpanel";
import {
  addPendingPostImagePublicIds,
  getPendingPostImagePublicIds,
  removePendingPostImagePublicIds,
  uploadPostImagesToCloudinary,
  type PickedPostImageFile,
} from "../../lib/postImages";
import { trpc } from "../../lib/trpc";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

import { PostImagesUploader } from "./PostImagesUploader";

import type { AddPostStackParamList } from "../../navigation/AddPostStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type PostFormValues = z.infer<typeof zCreatePostTrpcInput>;

type AddPostNavProp = NativeStackNavigationProp<
  AddPostStackParamList,
  "AddPost"
>;

type AddPostFormProps = {
  communityId?: string;
  contextTitle?: string;
  onSuccess?: () => void;
};

const TEXT_AREA_MIN_HEIGHT = 120;
const TEXT_AREA_PADDING_VERTICAL = 20;
const TEXT_AREA_PADDING_HORIZONTAL = 20;
const TEXT_AREA_LINE_HEIGHT = 24;

const EMPTY_POST_ERROR =
  "Добавьте заголовок, текст или хотя бы одно изображение";

const normalizeTextField = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeImageIds = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (imageId): imageId is string =>
          typeof imageId === "string" && imageId.trim().length > 0,
      )
    : [];

export const AddPostForm = ({
  communityId,
  contextTitle,
  onSuccess,
}: AddPostFormProps) => {
  const utils = trpc.useUtils();
  const feedback = useAppFeedback();
  const navigation = useNavigation<AddPostNavProp>();
  const prepareCloudinaryUpload = trpc.prepareCloudinaryUpload.useMutation();
  const cleanupPostImages = trpc.cleanupPostImages.useMutation();
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isTitleFieldVisible, setIsTitleFieldVisible] = useState(false);
  const [measuredTextHeight, setMeasuredTextHeight] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PickedPostImageFile[]>([]);
  const createPost = trpc.createPost.useMutation({
    onSuccess: () => {
      utils.getPosts.invalidate();
      utils.getMyPosts.invalidate();
      utils.getUserPosts.invalidate();
      utils.getRatedPosts.invalidate();
    },
  });
  const formik = useFormik<PostFormValues>({
    initialValues: {
      title: "",
      description: "some mock description",
      text: "",
      images: [],
    },
    validationSchema: toFormikValidationSchema(zCreatePostTrpcInput),
    onSubmit: async (values, { resetForm }) => {
      const normalizedTitle = normalizeTextField(values.title);
      const normalizedText = normalizeTextField(values.text);
      const normalizedDescription =
        normalizeTextField(values.description) || "some mock description";
      const currentImages = normalizeImageIds(values.images);
      const hasAnyContent =
        normalizedTitle.length > 0 ||
        normalizedText.length > 0 ||
        currentImages.length > 0 ||
        pendingImages.length > 0;

      if (!hasAnyContent) {
        setSubmitError(EMPTY_POST_ERROR);
        feedback.showError(EMPTY_POST_ERROR, "Пост пустой");
        return;
      }

      setSubmitError(null);
      setIsUploadingImages(true);
      feedback.showLoading(
        pendingImages.length > 0 ? "Загружаем изображения..." : "Публикуем...",
      );
      const newlyUploadedImagePublicIds: string[] = [];

      try {
        const pendingImageIdsFromPreviousAttempts =
          await getPendingPostImagePublicIds();
        if (pendingImageIdsFromPreviousAttempts.length > 0) {
          try {
            await cleanupPostImages.mutateAsync({
              imagePublicIds: pendingImageIdsFromPreviousAttempts,
            });
            await removePendingPostImagePublicIds(
              pendingImageIdsFromPreviousAttempts,
            );
          } catch {
            // ignore cleanup errors: will retry on next submission
          }
        }

        const uploadedImages = await uploadPostImagesToCloudinary({
          files: pendingImages,
          prepareCloudinaryUpload: () =>
            prepareCloudinaryUpload.mutateAsync({
              type: "image",
            }),
          onUploadedPublicId: async (publicId) => {
            newlyUploadedImagePublicIds.push(publicId);
            await addPendingPostImagePublicIds([publicId]);
          },
        });
        const post = await createPost.mutateAsync({
          title: normalizedTitle,
          description: normalizedDescription,
          text: normalizedText,
          images: [...currentImages, ...uploadedImages],
          ...(communityId ? { communityId } : {}),
        });
        mixpanelTrackPostCreated({
          communityId: communityId ?? null,
          id: post.id,
          imagesCount: currentImages.length + uploadedImages.length,
          publisherType: communityId ? "community" : "user",
          source: communityId ? "community_composer" : "post_composer",
          textLength: normalizedText.length,
          titleLength: normalizedTitle.length,
        });
        feedback.showSuccess("Пост опубликован");
        setPendingImages([]);
        setIsTitleFieldVisible(false);
        resetForm();
        if (onSuccess) {
          onSuccess();
        } else {
          navigation.goBack();
        }

        await removePendingPostImagePublicIds(uploadedImages);
      } catch (error) {
        if (newlyUploadedImagePublicIds.length > 0) {
          try {
            await cleanupPostImages.mutateAsync({
              imagePublicIds: newlyUploadedImagePublicIds,
            });
            await removePendingPostImagePublicIds(newlyUploadedImagePublicIds);
          } catch {
            // ignore cleanup errors: user can retry and cleanup later
          }
        }

        if (error instanceof Error) {
          setSubmitError(error.message);
        } else {
          setSubmitError("Не удалось создать пост");
        }
        feedback.showError(
          getErrorMessage(error, "Не удалось создать пост"),
          "Ошибка публикации",
        );
      } finally {
        setIsUploadingImages(false);
      }
    },
  });
  const imageErrorText =
    formik.touched.images && typeof formik.errors.images === "string"
      ? formik.errors.images
      : null;
  const hasAnyContent =
    normalizeTextField(formik.values.title).length > 0 ||
    normalizeTextField(formik.values.text).length > 0 ||
    normalizeImageIds(formik.values.images).length > 0 ||
    pendingImages.length > 0;
  const textAreaHeight = Math.max(
    TEXT_AREA_MIN_HEIGHT,
    measuredTextHeight + TEXT_AREA_PADDING_VERTICAL * 2,
  );

  return (
    <View style={styles.container}>
      {contextTitle ? (
        <Text style={styles.contextTitle}>{contextTitle}</Text>
      ) : null}

      {isTitleFieldVisible ? (
        <View style={styles.titleFieldWrapper}>
          <TextInput
            placeholder="Придумайте заголовок ..."
            placeholderTextColor={COLORS.white25}
            value={formik.values.title}
            onChangeText={(text) => {
              setSubmitError(null);
              formik.setFieldValue("title", text);
            }}
            onBlur={() => formik.setFieldTouched("title")}
            style={[
              styles.input,
              formik.touched.title && formik.errors.title
                ? styles.inputError
                : null,
            ]}
          />
          <TouchableOpacity
            style={styles.removeTitleButton}
            onPress={() => {
              setSubmitError(null);
              setIsTitleFieldVisible(false);
              formik.setFieldValue("title", "");
              formik.setFieldTouched("title", false, false);
            }}
          >
            <Ionicons name="close" size={18} color={COLORS.white85} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addTitleButton}
          onPress={() => setIsTitleFieldVisible(true)}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={COLORS.white85}
          />
          <Text style={styles.addTitleButtonText}>Добавить заголовок</Text>
        </TouchableOpacity>
      )}

      {formik.touched.title && formik.errors.title && (
        <Text style={styles.errorText}>{formik.errors.title}</Text>
      )}

      <View style={styles.textAreaWrapper}>
        <Text
          style={styles.textAreaMeasure}
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            setMeasuredTextHeight((prev) =>
              prev === nextHeight ? prev : nextHeight,
            );
          }}
          accessible={false}
        >
          {formik.values.text || " "}
        </Text>
        <TextInput
          placeholder="Добавьте текст ..."
          placeholderTextColor={COLORS.white25}
          value={formik.values.text}
          onChangeText={(text) => {
            setSubmitError(null);
            formik.setFieldValue("text", text);
          }}
          onBlur={() => formik.setFieldTouched("text")}
          multiline
          scrollEnabled={false}
          style={[
            styles.textArea,
            { height: textAreaHeight },
            formik.touched.text && formik.errors.text
              ? styles.inputError
              : null,
          ]}
        />
      </View>

      {formik.touched.text && formik.errors.text && (
        <Text style={styles.errorText}>{formik.errors.text}</Text>
      )}

      <PostImagesUploader
        uploadedImages={formik.values.images}
        pendingImages={pendingImages}
        disabled={formik.isSubmitting}
        onUploadedImagesChange={(images) => {
          setSubmitError(null);
          formik.setFieldTouched("images", true, false);
          void formik.setFieldValue("images", images);
        }}
        onPendingImagesChange={(images) => {
          setSubmitError(null);
          setPendingImages(images);
        }}
      />

      {imageErrorText ? (
        <Text style={styles.errorText}>{imageErrorText}</Text>
      ) : null}
      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <AppButton
        title={
          isUploadingImages
            ? "Загружаем изображения..."
            : formik.isSubmitting
              ? "Публикуем..."
              : "Опубликовать"
        }
        onPress={() => {
          if (!hasAnyContent) {
            setSubmitError(EMPTY_POST_ERROR);
            feedback.showError(EMPTY_POST_ERROR, "Пост пустой");
            return;
          }
          formik.handleSubmit();
        }}
        style={styles.startButton}
        disabled={formik.isSubmitting || isUploadingImages || !hasAnyContent}
      />
    </View>
  );
};

const styles = {
  addTitleButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    flexDirection: "row" as const,
    gap: 8,
    height: 48,
    justifyContent: "center" as const,
    paddingHorizontal: 16,
  },
  addTitleButtonText: {
    color: COLORS.white85,
    fontSize: 16,
    lineHeight: 24,
  },
  container: {
    gap: 14,
    marginTop: 28,
    paddingBottom: 24,
  },
  contextTitle: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: COLORS.postsCardBackground,
    height: 60,
    color: COLORS.white100,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    ...webInputFocusReset,
    flexShrink: 0,
    paddingRight: 52,
  },
  removeTitleButton: {
    alignItems: "center" as const,
    height: 40,
    justifyContent: "center" as const,
    position: "absolute" as const,
    right: 10,
    top: 10,
    width: 40,
  },
  textArea: {
    backgroundColor: COLORS.postsCardBackground,
    fontSize: 16,
    lineHeight: TEXT_AREA_LINE_HEIGHT,
    paddingHorizontal: TEXT_AREA_PADDING_HORIZONTAL,
    paddingVertical: TEXT_AREA_PADDING_VERTICAL,
    borderRadius: 32,
    textAlignVertical: "top" as const,
    color: COLORS.white100,
    ...webInputFocusReset,
    flexShrink: 0,
  },
  textAreaMeasure: {
    fontSize: 16,
    left: TEXT_AREA_PADDING_HORIZONTAL,
    lineHeight: TEXT_AREA_LINE_HEIGHT,
    opacity: 0,
    pointerEvents: "none" as const,
    position: "absolute" as const,
    right: TEXT_AREA_PADDING_HORIZONTAL,
    top: 0,
  },
  textAreaWrapper: {
    position: "relative" as const,
  },
  titleFieldWrapper: {
    position: "relative" as const,
  },
  inputError: {
    borderColor: COLORS.inputErrorBorderColor,
  },
  errorText: {
    color: COLORS.inputErrorBorderColor,
    fontSize: 12,
    marginBottom: 4,
  },
  startButton: {
    height: 40,
    marginTop: 8,
  },
};
