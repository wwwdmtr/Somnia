import { zUpdatePostTrpcInput } from "@somnia/shared/src/router/updatePost/input";
import { useFormik } from "formik";
import React, { useState } from "react";
import { View, TextInput, Text, Platform } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

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

import type { TrpcRouter } from "@somnia/shared/src/router";
import type { inferRouterOutputs } from "@trpc/server";

type UpdatePostFormsValues = z.infer<typeof zUpdatePostTrpcInput>;
type RouterOutputs = inferRouterOutputs<TrpcRouter>;
type Post = Omit<
  NonNullable<RouterOutputs["getPost"]["post"]>,
  "createdAt" | "deletedAt"
> & {
  createdAt: Date;
  deletedAt: Date | null;
};

type UpdatePostFormsProps = {
  post: Post;
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

export const UpdatePostForms = ({ post, onSuccess }: UpdatePostFormsProps) => {
  const utils = trpc.useUtils();
  const prepareCloudinaryUpload = trpc.prepareCloudinaryUpload.useMutation();
  const cleanupPostImages = trpc.cleanupPostImages.useMutation();
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [measuredTextHeight, setMeasuredTextHeight] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PickedPostImageFile[]>([]);
  const updatePost = trpc.updatePost.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getPosts.invalidate(),
        utils.getPost.invalidate({ id: post.id }),
        utils.getMyPosts.invalidate(),
        utils.getUserPosts.invalidate(),
      ]);
      onSuccess?.();
    },
  });

  const formik = useFormik<UpdatePostFormsValues>({
    initialValues: {
      postId: post.id,
      title: post.title ?? "",
      description: post.description ?? "",
      text: post.text ?? "",
      images: post.images ?? [],
    },
    validationSchema: toFormikValidationSchema(
      zUpdatePostTrpcInput.omit({ postId: true }),
    ),
    enableReinitialize: true,

    onSubmit: async (values, { resetForm }) => {
      const normalizedTitle = normalizeTextField(values.title);
      const normalizedText = normalizeTextField(values.text);
      const normalizedDescription = normalizeTextField(values.description);
      const currentImages = normalizeImageIds(values.images);
      const hasAnyContent =
        normalizedTitle.length > 0 ||
        normalizedText.length > 0 ||
        currentImages.length > 0 ||
        pendingImages.length > 0;

      if (!hasAnyContent) {
        setSubmitError(EMPTY_POST_ERROR);
        return;
      }

      setSubmitError(null);
      setIsUploadingImages(true);
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
        await updatePost.mutateAsync({
          postId: values.postId,
          title: normalizedTitle,
          description: normalizedDescription,
          text: normalizedText,
          images: [...currentImages, ...uploadedImages],
        });
        setPendingImages([]);
        resetForm();
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
          setSubmitError("Не удалось обновить пост");
        }
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
      <TextInput
        placeholder="Придумайте заголовок"
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
          placeholder="Напишите текст ..."
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
        disabled={formik.isSubmitting || isUploadingImages}
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
              ? "Сохранение..."
              : "Сохранить изменения"
        }
        onPress={() => formik.handleSubmit()}
        style={styles.startButton}
        disabled={
          formik.isSubmitting ||
          isUploadingImages ||
          !formik.isValid ||
          !hasAnyContent
        }
      />
    </View>
  );
};

const styles = {
  container: {
    gap: 14,
  },
  input: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: COLORS.postsCardBackground,
    height: 60,
    color: COLORS.white100,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    ...webInputFocusReset,
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
  inputError: {
    borderColor: "white",
  },
  errorText: {
    color: "white",
    fontSize: 12,
    marginBottom: 4,
  },
  startButton: {
    height: 44,
    marginBottom: 24,
    marginTop: 8,
  } as const,
};
