import { useNavigation } from "@react-navigation/native";
import { zCreatePostTrpcInput } from "@somnia/shared/src/router/createPost/input";
import { useFormik } from "formik";
import React, { useState } from "react";
import { View, TextInput, Text } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

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

export const AddPostForm = () => {
  const utils = trpc.useUtils();
  const navigation = useNavigation<AddPostNavProp>();
  const [isUploadingImages, setIsUploadingImages] = useState(false);
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
      await createPost.mutateAsync(values);
      resetForm();
      navigation.goBack();
    },
  });
  const imageErrorText =
    formik.touched.images && typeof formik.errors.images === "string"
      ? formik.errors.images
      : null;

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Придумайте заголовок ..."
        placeholderTextColor={COLORS.white25}
        value={formik.values.title}
        onChangeText={(text) => formik.setFieldValue("title", text)}
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
        onChangeText={(text) => formik.setFieldValue("text", text)}
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
        images={formik.values.images}
        onUploadingChange={setIsUploadingImages}
        disabled={formik.isSubmitting}
        onChange={(images) => {
          formik.setFieldTouched("images", true, false);
          void formik.setFieldValue("images", images);
        }}
      />

      {imageErrorText ? (
        <Text style={styles.errorText}>{imageErrorText}</Text>
      ) : null}

      <AppButton
        title={
          formik.isSubmitting
            ? "Публикуем..."
            : isUploadingImages
              ? "Загружаем изображения..."
              : "Опубликовать"
        }
        onPress={() => formik.handleSubmit()}
        style={styles.startButton}
        disabled={formik.isSubmitting || isUploadingImages || !formik.isValid}
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
