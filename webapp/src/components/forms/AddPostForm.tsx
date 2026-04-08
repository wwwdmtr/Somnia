import { useNavigation } from "@react-navigation/native";
import { zCreatePostTrpcInput } from "@somnia/shared/src/router/createPost/input";
import { useFormik } from "formik";
import React, { useState } from "react";
import { View, TextInput, Text } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import {
  uploadPostImagesToCloudinary,
  type PickedPostImageFile,
} from "../../lib/postImages";
import { trpc } from "../../lib/trpc";
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

export const AddPostForm = () => {
  const utils = trpc.useUtils();
  const navigation = useNavigation<AddPostNavProp>();
  const prepareCloudinaryUpload = trpc.prepareCloudinaryUpload.useMutation();
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<PickedPostImageFile[]>([]);
  const createPost = trpc.createPost.useMutation({
    onSuccess: () => {
      utils.getPosts.invalidate();
      utils.getMyPosts.invalidate();
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
        return;
      }

      setSubmitError(null);
      setIsUploadingImages(true);
      try {
        const uploadedImages = await uploadPostImagesToCloudinary({
          files: pendingImages,
          prepareCloudinaryUpload: () =>
            prepareCloudinaryUpload.mutateAsync({
              type: "image",
            }),
        });
        await createPost.mutateAsync({
          title: normalizedTitle,
          description: normalizedDescription,
          text: normalizedText,
          images: [...currentImages, ...uploadedImages],
        });
        setPendingImages([]);
        resetForm();
        navigation.goBack();
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

  return (
    <View style={styles.container}>
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

      {formik.touched.title && formik.errors.title && (
        <Text style={styles.errorText}>{formik.errors.title}</Text>
      )}

      <TextInput
        placeholder="Добавьте описание ..."
        placeholderTextColor={COLORS.white25}
        value={formik.values.text}
        onChangeText={(text) => {
          setSubmitError(null);
          formik.setFieldValue("text", text);
        }}
        onBlur={() => formik.setFieldTouched("text")}
        multiline
        style={[
          styles.textArea,
          formik.touched.text && formik.errors.text ? styles.inputError : null,
        ]}
      />

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
  container: {
    gap: 14,
    marginTop: 28,
    paddingBottom: 24,
  },
  input: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: COLORS.postsCardBackground,
    height: 60,
    color: COLORS.white100,
    flexShrink: 0,
  },
  textArea: {
    backgroundColor: COLORS.postsCardBackground,
    padding: 20,
    borderRadius: 32,
    height: 200,
    minHeight: 200,
    textAlignVertical: "top" as const,
    color: COLORS.white100,
    flexShrink: 0,
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
    height: 40,
    marginTop: 8,
  },
};
