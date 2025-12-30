import { zUpdatePostTrpcInput } from "@somnia/server/src/router/updatePost/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Text } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { trpc } from "../../lib/trpc";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

import type { TrpcRouter } from "@somnia/server/src/router";
import type { inferRouterOutputs } from "@trpc/server";

type UpdatePostFormsValues = z.infer<typeof zUpdatePostTrpcInput>;
type RouterOutputs = inferRouterOutputs<TrpcRouter>;
type Post = Omit<NonNullable<RouterOutputs["getPost"]["post"]>, "createdAt"> & {
  createdAt: Date;
};

type UpdatePostFormsProps = {
  post: Post;
  onSuccess?: () => void;
};

export const UpdatePostForms = ({ post, onSuccess }: UpdatePostFormsProps) => {
  const utils = trpc.useUtils();
  const updatePost = trpc.updatePost.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getPosts.invalidate(),
        utils.getPost.invalidate({ id: post.id }),
        utils.getMyPosts.invalidate(),
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
    },
    validationSchema: toFormikValidationSchema(
      zUpdatePostTrpcInput.omit({ postId: true }),
    ),
    enableReinitialize: true,

    onSubmit: async (values, { resetForm }) => {
      await updatePost.mutateAsync(values);
      resetForm();
    },
  });

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Придумайте заголовок"
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
        placeholder="Опишите, что вам снилось ..."
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

      <AppButton
        title={formik.isSubmitting ? "Сохранение..." : "Сохранить изменения"}
        onPress={() => formik.handleSubmit()}
        style={styles.startButton}
        disabled={formik.isSubmitting || !formik.isValid}
      />
    </View>
  );
};

const styles = {
  container: {
    gap: 14,
    flex: 1,
    height: 680,
  },
  input: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: COLORS.postsCardBackground,
    height: 60,
    color: COLORS.white100,
  },
  textArea: {
    backgroundColor: COLORS.postsCardBackground,
    padding: 20,
    borderRadius: 32,
    height: 200,
    textAlignVertical: "top" as const,
    color: COLORS.white100,
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
    position: "absolute",
    width: "100%",
    bottom: 40,
  } as const,
};
