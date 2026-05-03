import { Ionicons } from "@expo/vector-icons";
import { zCreateCommentTrpcInput } from "@somnia/shared/src/router/createComment/input";
import { useFormik } from "formik";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Platform,
} from "react-native";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { trpc } from "../../lib/trpc";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS, typography } from "../../theme/typography";

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

const COMMENT_INPUT_MIN_HEIGHT = 52;
const COMMENT_INPUT_MAX_HEIGHT = 244;
const COMMENT_INPUT_LINE_HEIGHT = 20;
const COMMENT_INPUT_PADDING_VERTICAL = 20;
const COMMENT_INPUT_PADDING_HORIZONTAL = 14;
const SEND_BUTTON_SIZE = 42;

export const AddCommentForm = ({
  postId,
  parentId,
  replyToNickname,
  onSuccess,
  onCancelReply,
}: AddCommentFormProps) => {
  const utils = trpc.useUtils();
  const [measuredTextHeight, setMeasuredTextHeight] = useState(0);

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
        parentId: parentId ?? undefined,
      });
      resetForm();
    },
  });

  useEffect(() => {
    if (parentId && replyToNickname) {
      const prefix = `@${replyToNickname}:  `;
      if (!formik.values.content.startsWith(prefix)) {
        formik.setFieldValue("content", prefix);
      }
    }
  }, [parentId, replyToNickname, formik]);

  const inputHeight = Math.min(
    COMMENT_INPUT_MAX_HEIGHT,
    Math.max(
      COMMENT_INPUT_MIN_HEIGHT,
      measuredTextHeight + COMMENT_INPUT_PADDING_VERTICAL * 2,
    ),
  );
  const isInputScrollable = inputHeight >= COMMENT_INPUT_MAX_HEIGHT;
  const canSubmit =
    formik.isValid &&
    formik.values.content.trim().length > 0 &&
    !formik.isSubmitting;

  return (
    <View style={styles.container}>
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

      <View style={styles.composerWrap}>
        <Text
          style={styles.inputMeasure}
          onLayout={(event) => {
            const nextHeight = Math.ceil(event.nativeEvent.layout.height);
            setMeasuredTextHeight((prev) =>
              prev === nextHeight ? prev : nextHeight,
            );
          }}
          accessible={false}
        >
          {formik.values.content || " "}
        </Text>

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
          scrollEnabled={isInputScrollable}
          style={[
            styles.input,
            { height: inputHeight },
            formik.touched.content && formik.errors.content
              ? styles.inputError
              : null,
          ]}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            !canSubmit ? styles.sendButtonDisabled : null,
          ]}
          onPress={() => formik.handleSubmit()}
          disabled={!canSubmit}
          activeOpacity={0.85}
        >
          {formik.isSubmitting ? (
            <ActivityIndicator color={COLORS.white100} size="small" />
          ) : (
            <Ionicons name="send" size={18} color={COLORS.white100} />
          )}
        </TouchableOpacity>
      </View>

      {formik.touched.content && formik.errors.content && (
        <Text style={styles.errorText}>{formik.errors.content}</Text>
      )}
    </View>
  );
};

const styles = {
  container: {
    gap: 8,
  },
  composerWrap: {
    position: "relative" as const,
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
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 22,
    color: COLORS.white100,
    lineHeight: COMMENT_INPUT_LINE_HEIGHT,
    minHeight: COMMENT_INPUT_MIN_HEIGHT,
    paddingBottom: COMMENT_INPUT_PADDING_VERTICAL + 2,
    paddingHorizontal: COMMENT_INPUT_PADDING_HORIZONTAL,
    paddingRight: COMMENT_INPUT_PADDING_HORIZONTAL + SEND_BUTTON_SIZE + 12,
    paddingTop: COMMENT_INPUT_PADDING_VERTICAL,
    textAlignVertical: "top" as const,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    ...webInputFocusReset,
  },
  inputError: {
    borderColor: COLORS.inputErrorBorderColor,
    borderWidth: 1,
  },
  inputMeasure: {
    fontSize: 16,
    left: COMMENT_INPUT_PADDING_HORIZONTAL,
    lineHeight: COMMENT_INPUT_LINE_HEIGHT,
    opacity: 0,
    pointerEvents: "none" as const,
    position: "absolute" as const,
    right: COMMENT_INPUT_PADDING_HORIZONTAL + SEND_BUTTON_SIZE + 12,
    top: 0,
  },
  sendButton: {
    alignItems: "center" as const,
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 999,
    bottom: 9,
    height: SEND_BUTTON_SIZE,
    justifyContent: "center" as const,
    position: "absolute" as const,
    right: 6,
    width: SEND_BUTTON_SIZE,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.buttonBackgroundMuted,
  },
  errorText: {
    color: COLORS.inputErrorBorderColor,
    fontSize: 12,
    marginBottom: 4,
  },
};
