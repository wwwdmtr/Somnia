import { Ionicons } from "@expo/vector-icons";
import { zSignInTrpcInput } from "@somnia/server/src/router/signIn/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { setToken } from "../../lib/tokenStorage";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

type SignInFormValues = z.infer<typeof zSignInTrpcInput>;

export const SignInForm = () => {
  const trpcUtils = trpc.useUtils();

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);

  const signIn = trpc.signIn.useMutation({
    onSuccess: () => {
      console.info("Sign in successful");
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });
  const formik = useFormik<SignInFormValues>({
    initialValues: {
      nickname: "",
      password: "",
    },
    validationSchema: toFormikValidationSchema(zSignInTrpcInput),
    onSubmit: async (values, { resetForm }) => {
      const { nickname, password } = values;
      const { token } = await signIn.mutateAsync({ nickname, password });
      await setToken(token);
      trpcUtils.invalidate();
      resetForm();
    },
  });

  return (
    <View style={styles.container}>
      <Text style={typography.caption_white85}>Введите Имя пользователя</Text>
      <TextInput
        placeholder="Имя пользователя"
        placeholderTextColor={COLORS.white25}
        value={formik.values.nickname}
        onChangeText={(text) => formik.setFieldValue("nickname", text)}
        onBlur={() => formik.setFieldTouched("nickname")}
        style={[
          styles.input,
          formik.touched.nickname && formik.errors.nickname
            ? styles.inputError
            : null,
        ]}
        autoCapitalize="none"
      />
      <Text style={typography.caption_white85}>Введите Пароль</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Пароль"
          placeholderTextColor={COLORS.white25}
          secureTextEntry={!isPasswordVisible}
          value={formik.values.password}
          onChangeText={(text) => formik.setFieldValue("password", text)}
          onBlur={() => formik.setFieldTouched("password")}
          style={[
            styles.input,
            styles.passwordInput,
            formik.touched.password && formik.errors.password
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

      {(formik.touched.nickname && formik.errors.nickname && (
        <Text style={styles.errorText}>{formik.errors.nickname}</Text>
      )) ||
        (formik.touched.password && formik.errors.password && (
          <Text style={styles.errorText}>{formik.errors.password}</Text>
        ))}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <AppButton
        title={formik.isSubmitting ? "Вход..." : "Войти"}
        onPress={() => formik.handleSubmit()}
        style={styles.startButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 120,
  },
  errorText: {
    color: COLORS.white100,
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.inputBackgroundColor,
    borderColor: COLORS.inputBorderColor,
    borderRadius: 99,
    borderWidth: 1,
    color: COLORS.white100,
    marginBottom: 28,
    marginTop: 12,
    padding: 11,
  },
  inputError: {
    borderColor: COLORS.inputErrorBorderColor,
  },
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
    bottom: 0,
    height: 40,
    left: 0,
    position: "absolute" as const,
    right: 0,
  },
});
