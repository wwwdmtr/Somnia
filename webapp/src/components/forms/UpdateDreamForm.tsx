import { zUpdateDreamTrpcInput } from "@somnia/server/src/router/updateDream/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Button, Text } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { trpc } from "../../lib/trpc";

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
        placeholder="Dream title"
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
        placeholder="Dream description"
        value={formik.values.description}
        onChangeText={(text) => formik.setFieldValue("description", text)}
        onBlur={() => formik.setFieldTouched("description")}
        style={[
          styles.input,
          formik.touched.description && formik.errors.description
            ? styles.inputError
            : null,
        ]}
      />
      {formik.touched.description && formik.errors.description && (
        <Text style={styles.errorText}>{formik.errors.description}</Text>
      )}

      <TextInput
        placeholder="Dream text"
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

      <Button
        title={formik.isSubmitting ? "Saving..." : "Save changes"}
        onPress={() => formik.handleSubmit()}
        disabled={formik.isSubmitting || !formik.isValid}
      />
    </View>
  );
};

const styles = {
  container: {
    padding: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  textArea: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    height: 200,
    textAlignVertical: "top" as const,
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 4,
  },
};
