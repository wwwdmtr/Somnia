import { zUpdateDreamTrpcInput } from "@somnia/server/src/router/updateDream/input";
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

type UpdateDreamFormValues = z.infer<typeof zUpdateDreamTrpcInput>;
type RouterOutputs = inferRouterOutputs<TrpcRouter>;
type Dream = Omit<
  NonNullable<RouterOutputs["getDream"]["dream"]>,
  "createdAt"
> & {
  createdAt: Date;
};

type UpdateDreamFormProps = {
  dream: Dream;
  onSuccess?: () => void;
};

export const UpdateDreamForm = ({ dream, onSuccess }: UpdateDreamFormProps) => {
  const utils = trpc.useUtils();
  const updateDream = trpc.updateDream.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getDreams.invalidate(),
        utils.getDream.invalidate({ id: dream.id }),
      ]);
      onSuccess?.();
    },
  });
  const formik = useFormik<UpdateDreamFormValues>({
    initialValues: {
      dreamId: dream.id,
      title: dream.title ?? "",
      description: dream.description ?? "",
      text: dream.text ?? "",
    },
    validationSchema: toFormikValidationSchema(
      zUpdateDreamTrpcInput.omit({ dreamId: true }),
    ),
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => {
      await updateDream.mutateAsync(values);
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
