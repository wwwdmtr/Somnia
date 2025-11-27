import { zUpadteProfileTrpcInput } from "@somnia/server/src/router/updateProfile/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Button, Text } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { useMe } from "../lib/ctx";
import { trpc } from "../lib/trpc";

type UpdatePorfileFormValues = z.infer<typeof zUpadteProfileTrpcInput>;

export const UpdateProfileForm = () => {
  const trpcUtils = trpc.useUtils();
  const me = useMe();
  const updateProfile = trpc.updateProfile.useMutation();
  const formik = useFormik<UpdatePorfileFormValues>({
    initialValues: {
      nickname: me?.nickname ?? "",
      name: me?.name ?? "",
    },
    enableReinitialize: true,
    validationSchema: toFormikValidationSchema(zUpadteProfileTrpcInput),
    onSubmit: async (values) => {
      const updatedMe = await updateProfile.mutateAsync(values);
      trpcUtils.getMe.setData(undefined, { me: updatedMe });
    },
  });
  if (!me) {
    return (
      <View style={styles.container}>
        <Text>Вы не авторизованы</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Nickname"
        value={formik.values.nickname}
        onChangeText={(text) => formik.setFieldValue("nickname", text)}
        onBlur={() => formik.setFieldTouched("nickname")}
        style={[
          styles.input,
          formik.touched.nickname && formik.errors.nickname
            ? styles.inputError
            : null,
        ]}
      />
      {formik.touched.nickname && formik.errors.nickname && (
        <Text style={styles.errorText}>{formik.errors.nickname}</Text>
      )}

      <TextInput
        placeholder="Name"
        value={formik.values.name}
        onChangeText={(text) => formik.setFieldValue("name", text)}
        onBlur={() => formik.setFieldTouched("name")}
        style={[
          styles.input,
          formik.touched.name && formik.errors.name ? styles.inputError : null,
        ]}
      />
      {formik.touched.name && formik.errors.name && (
        <Text style={styles.errorText}>{formik.errors.name}</Text>
      )}

      <Button
        title={formik.isSubmitting ? "Saving..." : "Update Profile"}
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
