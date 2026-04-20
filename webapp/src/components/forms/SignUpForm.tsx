import { Ionicons } from "@expo/vector-icons";
import { zSignUpTrpcInput } from "@somnia/shared/src/router/signUp/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Text, Pressable, Platform } from "react-native";
import { StyleSheet } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { mixpanelTrackSignUp } from "../../lib/mixpanel";
import { setToken } from "../../lib/tokenStorage";
import { trpc } from "../../lib/trpc";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS, typography } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

const signUpFormSchema = zSignUpTrpcInput
  .extend({
    passwordConfirmation: z
      .string({ message: "Необходимо подтвердить пароль" })
      .min(1, "Необходимо подтвердить пароль"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Пароли не совпадают",
    path: ["passwordConfirmation"],
  });

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export const SignUpForm = () => {
  const trpcUtils = trpc.useUtils();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [isRepeatPasswordVisible, setIsRepeatPasswordVisible] =
    React.useState(false);

  const signUp = trpc.signUp.useMutation({
    onSuccess: () => {
      console.info("Sign up successful");
      setErrorMessage(null);
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });
  const formik = useFormik<SignUpFormValues>({
    initialValues: {
      nickname: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
    validationSchema: toFormikValidationSchema(signUpFormSchema),
    onSubmit: async (values, { resetForm }) => {
      const { nickname, email, password } = values;
      const normalizedNickname = nickname.toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();
      const { token } = await signUp.mutateAsync({
        nickname: normalizedNickname,
        email: normalizedEmail,
        password,
      });
      await setToken(token);
      mixpanelTrackSignUp();

      void trpcUtils.invalidate();
      resetForm();
    },
  });

  return (
    <View style={styles.container}>
      <Text style={typography.caption_white85}>Имя пользователя</Text>
      <TextInput
        placeholder="Имя пользователя"
        placeholderTextColor={COLORS.white25}
        value={formik.values.nickname}
        onChangeText={(text) =>
          formik.setFieldValue("nickname", text.toLowerCase())
        }
        onBlur={() => formik.setFieldTouched("nickname")}
        style={[
          styles.input,
          formik.touched.nickname && formik.errors.nickname
            ? styles.inputError
            : null,
        ]}
        autoCapitalize="none"
      />

      <Text style={typography.caption_white85}>E-mail</Text>
      <TextInput
        placeholder="E-mail"
        placeholderTextColor={COLORS.white25}
        value={formik.values.email}
        onChangeText={(text) =>
          formik.setFieldValue("email", text.toLowerCase())
        }
        onBlur={() => formik.setFieldTouched("email")}
        style={[
          styles.input,
          formik.touched.email && formik.errors.email
            ? styles.inputError
            : null,
        ]}
        autoCapitalize="none"
      />

      <Text style={typography.caption_white85}>Пароль</Text>
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

      <Text style={typography.caption_white85}>Пароль</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Пароль"
          placeholderTextColor={COLORS.white25}
          secureTextEntry={!isRepeatPasswordVisible}
          value={formik.values.passwordConfirmation}
          onChangeText={(text) =>
            formik.setFieldValue("passwordConfirmation", text)
          }
          onBlur={() => formik.setFieldTouched("passwordConfirmation")}
          style={[
            styles.input,
            styles.passwordInput,
            formik.touched.passwordConfirmation &&
            formik.errors.passwordConfirmation
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

      {(formik.touched.nickname && formik.errors.nickname && (
        <Text style={styles.errorText}>{formik.errors.nickname}</Text>
      )) ||
        (formik.touched.email && formik.errors.email && (
          <Text style={styles.errorText}>{formik.errors.email}</Text>
        )) ||
        (formik.touched.password && formik.errors.password && (
          <Text style={styles.errorText}>{formik.errors.password}</Text>
        )) ||
        (formik.touched.passwordConfirmation &&
          formik.errors.passwordConfirmation && (
            <Text style={styles.errorText}>
              {formik.errors.passwordConfirmation}
            </Text>
          ))}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <AppButton
        title={formik.isSubmitting ? "Регистрация..." : "Регистрация"}
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
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    ...webInputFocusReset,
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
    bottom: 1,
    height: 40,
    left: 0,
    position: "absolute" as const,
    right: 0,
  },
});
