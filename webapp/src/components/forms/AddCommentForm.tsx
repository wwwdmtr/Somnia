import { Ionicons } from "@expo/vector-icons";
import { zCreateCommentTrpcInput } from "@somnia/server/src/router/createComment/input";
import { useFormik } from "formik";
import React, { useEffect } from "react";
import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

type CommentFormValues = {
  content: string;
};

type AddCommentFormProps = {
  postId: string;
  parentId?: string | null;
  replyToNickname?: string | null;
  onSuccess?: () => void;
  onCancelReply?: () => void;
};

export const AddCommentForm = ({
  postId,
  parentId,
  replyToNickname,
  onSuccess,
  onCancelReply,
}: AddCommentFormProps) => {
  const utils = trpc.useUtils();

  const createComment = trpc.createComment.useMutation({
    onSuccess: () => {
      utils.getCommentsByPost.invalidate({ postId });
      onSuccess?.();
    },
  });

  const formik = useFormik<CommentFormValues>({
    initialValues: {
      content: "",
    },
    validationSchema: toFormikValidationSchema(
      zCreateCommentTrpcInput.pick({ content: true }),
    ),
    onSubmit: async (values, { resetForm }) => {
      await createComment.mutateAsync({
        postId,
        content: values.content,
        parentId,
      });
      resetForm();
    },
  });

  // Авто-подстановка префикса при ответе на комментарий

  useEffect(() => {
    if (parentId && replyToNickname) {
      const prefix = `@${replyToNickname}:  `;
      // Добавляем префикс только если поле пустое или не начинается с него
      if (!formik.values.content.startsWith(prefix)) {
        formik.setFieldValue("content", prefix);
      }
    }
  }, [parentId, replyToNickname, formik]);

  return (
    <View style={styles.container}>
      {/* Reply Indicator */}
      {parentId && replyToNickname && (
        <View style={styles.replyIndicator}>
          <Text style={typography.caption_white85}>
            Ответ на комментарий @{replyToNickname}
          </Text>
          {onCancelReply && (
            <TouchableOpacity onPress={onCancelReply}>
              <Ionicons name="close" size={20} color={COLORS.white85} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <TextInput
        placeholder={
          parentId && replyToNickname
            ? `Ответить @${replyToNickname}...`
            : "Написать комментарий..."
        }
        placeholderTextColor={COLORS.white25}
        value={formik.values.content}
        onChangeText={(text) => formik.setFieldValue("content", text)}
        onBlur={() => formik.setFieldTouched("content")}
        multiline
        style={[
          styles.input,
          formik.touched.content && formik.errors.content
            ? styles.inputError
            : null,
        ]}
      />

      {formik.touched.content && formik.errors.content && (
        <Text style={styles.errorText}>{formik.errors.content}</Text>
      )}

      <AppButton
        title={formik.isSubmitting ? "Отправляем..." : "Отправить"}
        onPress={() => formik.handleSubmit()}
        disabled={formik.isSubmitting || !formik.isValid}
      />
    </View>
  );
};

const styles = {
  container: {
    gap: 8,
  },
  replyIndicator: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 16,
  },
  input: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: COLORS.postsCardBackground,
    minHeight: 48,
    maxHeight: 140,
    color: COLORS.white100,
    textAlignVertical: "top" as const,
  },
  inputError: {
    borderColor: "white",
    borderWidth: 1,
  },
  errorText: {
    color: "white",
    fontSize: 12,
    marginBottom: 4,
  },
};
