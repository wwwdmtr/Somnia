import { Ionicons } from "@expo/vector-icons";
import { zUpdatePasswordTrpcInput } from "@somnia/server/src/router/updatePassword/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { trpc } from "../../lib/trpc";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

const updatePasswordFormSchema = zUpdatePasswordTrpcInput
  .extend({
    newPasswordConfirm: z.string().min(8),
  })
  .superRefine((val, ctx) => {
    if (val.newPassword !== val.newPasswordConfirm) {
      ctx.addIssue({
        code: "custom",
        message: "Пароли не совпадают",
        path: ["newPasswordConfirm"],
      });
    }
  });

type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>;

export const UpdatePasswrordForm = () => {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    React.useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isRepeatPasswordVisible, setIsRepeatPasswordVisible] =
    React.useState(false);

  const updatePassword = trpc.updatePassword.useMutation({
    onSuccess: () => {
      console.info("Sign in successful");
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });
  const formik = useFormik<UpdatePasswordFormValues>({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      newPasswordConfirm: "",
    },
    validationSchema: toFormikValidationSchema(updatePasswordFormSchema),
    onSubmit: async ({ newPassword, currentPassword }, { resetForm }) => {
      await updatePassword.mutateAsync({ newPassword, currentPassword });
      resetForm();
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Текущий пароль"
          placeholderTextColor={COLORS.white25}
          secureTextEntry={!isCurrentPasswordVisible}
          value={formik.values.currentPassword}
          onChangeText={(text) => formik.setFieldValue("currentPassword", text)}
          onBlur={() => formik.setFieldTouched("currentPassword")}
          style={[
            styles.input,
            styles.passwordInput,
            formik.touched.currentPassword && formik.errors.currentPassword
              ? styles.inputError
              : null,
          ]}
        />

        <Pressable
          onPress={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}
          style={styles.passwordIcon}
          hitSlop={10}
        >
          <Ionicons
            name={isCurrentPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.white25}
          />
        </Pressable>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Новый пароль"
          placeholderTextColor={COLORS.white25}
          secureTextEntry={!isPasswordVisible}
          value={formik.values.newPassword}
          onChangeText={(text) => formik.setFieldValue("newPassword", text)}
          onBlur={() => formik.setFieldTouched("newPassword")}
          style={[
            styles.input,
            styles.passwordInput,
            formik.touched.newPassword && formik.errors.newPassword
              ? styles.inputError
              : null,
          ]}
        />

        <Pressable
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.passwordIcon}
          hitSlop={10}
        >
          <Ionicons
            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.white25}
          />
        </Pressable>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Подтвердите новый пароль"
          placeholderTextColor={COLORS.white25}
          secureTextEntry={!isRepeatPasswordVisible}
          value={formik.values.newPasswordConfirm}
          onChangeText={(text) =>
            formik.setFieldValue("newPasswordConfirm", text)
          }
          onBlur={() => formik.setFieldTouched("newPasswordConfirm")}
          style={[
            styles.input,
            styles.passwordInput,
            formik.touched.newPasswordConfirm &&
            formik.errors.newPasswordConfirm
              ? styles.inputError
              : null,
          ]}
        />
        <Pressable
          onPress={() => setIsRepeatPasswordVisible(!isRepeatPasswordVisible)}
          style={styles.passwordIcon}
          hitSlop={10}
        >
          <Ionicons
            name={isRepeatPasswordVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={COLORS.white25}
          />
        </Pressable>
      </View>

      {(formik.touched.currentPassword && formik.errors.currentPassword && (
        <Text style={styles.errorText}>{formik.errors.currentPassword}</Text>
      )) ||
        (formik.touched.newPassword && formik.errors.newPassword && (
          <Text style={styles.errorText}>{formik.errors.newPassword}</Text>
        )) ||
        (formik.touched.newPasswordConfirm &&
          formik.errors.newPasswordConfirm && (
            <Text style={styles.errorText}>
              {formik.errors.newPasswordConfirm}
            </Text>
          ))}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <AppButton
        title={formik.isSubmitting ? "Сохраняем..." : "Изменить пароль"}
        onPress={() => formik.handleSubmit()}
        style={styles.startButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  errorText: {
    color: COLORS.white85,
    fontSize: 12,
    marginBottom: 4,
  },

  input: {
    backgroundColor: COLORS.inputBackgroundColor,
    borderColor: COLORS.inputBorderColor,
    borderRadius: 99,
    borderWidth: 1,
    color: COLORS.white100,

    padding: 11,
  },
  inputError: {},

  passwordContainer: {
    justifyContent: "center",
    position: "relative",
  },

  passwordIcon: {
    bottom: 7,
    height: "100%",
    justifyContent: "center",
    position: "absolute",
    right: 16,
  },
  passwordInput: {
    paddingRight: 48,
  },
  startButton: {
    height: 40,
    marginTop: 20,
  },
});
