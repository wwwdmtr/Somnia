import { zCreateDreamTrpcInput } from "@somnia/server/src/router/createDream/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Button, Text } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { trpc } from "../../lib/trpc";

type DreamFormValues = z.infer<typeof zCreateDreamTrpcInput>;

export const AddDreamForm = () => {
  const utils = trpc.useUtils();
  const createDream = trpc.createDream.useMutation({
    onSuccess: () => {
      utils.getDreams.invalidate();
    },
  });
  const formik = useFormik<DreamFormValues>({
    initialValues: {
      title: "",
      description: "",
      text: "",
    },
    validationSchema: toFormikValidationSchema(zCreateDreamTrpcInput),
    onSubmit: async (values, { resetForm }) => {
      await createDream.mutateAsync(values);
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
        title={formik.isSubmitting ? "Submitting..." : "Submit Dream"}
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
