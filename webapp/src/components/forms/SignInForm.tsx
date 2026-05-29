import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { zSignInTrpcInput } from "@somnia/shared/src/router/auth/signIn/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Text, Pressable } from "react-native";
import { StyleSheet } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import ScreenName from "../../constants/ScreenName";
import TabName from "../../constants/TabName";
import { getErrorMessage, useAppFeedback } from "../../lib/appFeedback";
import { mixpanelTrackSignIn } from "../../lib/mixpanel";
import { setToken } from "../../lib/tokenStorage";
import { trpc } from "../../lib/trpc";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

import type { RootStackParamList } from "../../navigation/RootStackParamList";
import type { NavigationProp } from "@react-navigation/native";

type SignInFormValues = z.infer<typeof zSignInTrpcInput>;

export const SignInForm = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const trpcUtils = trpc.useUtils();
  const feedback = useAppFeedback();

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
      feedback.showLoading("Входим...");
      try {
        const { nickname, password } = values;
        const normalizedNickname = nickname.toLowerCase();
        const { token } = await signIn.mutateAsync({
          nickname: normalizedNickname,
          password,
        });
        await setToken(token);
        mixpanelTrackSignIn();
        trpcUtils.invalidate();
        resetForm();
        feedback.hideFeedback();
        navigation.navigate(ScreenName.RootTabs, {
          screen: TabName.FeedTab,
        });
      } catch (error) {
        feedback.showError(
          getErrorMessage(error, "Не удалось войти"),
          "Ошибка входа",
        );
        throw error;
      }
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ИМЯ ПОЛЬЗОВАТЕЛЯ</Text>
      <TextInput
        placeholder=""
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
      <Text style={styles.label}>ПАРОЛЬ</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder=""
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
        title={formik.isSubmitting ? "ВХОД..." : "ВОЙТИ"}
        onPress={() => formik.handleSubmit()}
        TextStyle={styles.startButtonText}
        style={styles.startButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  errorText: {
    color: COLORS.white100,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.authInputBackground,
    borderColor: COLORS.authInputBorder,
    borderRadius: 99,
    borderWidth: 1,
    color: COLORS.white100,
    fontSize: 16,
    height: 45,
    ...webInputFocusReset,
    marginBottom: 22,
    marginTop: 6,
    paddingHorizontal: 20,
  },
  inputError: {
    borderColor: COLORS.inputErrorBorderColor,
  },
  label: {
    color: COLORS.white85,
    fontFamily: "SFProText-Semibold",
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.82,
  },
  passwordContainer: {
    justifyContent: "center",
    position: "relative",
  },
  passwordIcon: {
    height: 45,
    justifyContent: "center",
    position: "absolute",
    right: 16,
    top: 6,
  },
  passwordInput: {
    paddingRight: 48,
  },
  startButton: {
    backgroundColor: COLORS.authPrimaryButton,
    height: 45,
    marginTop: 10,
  },
  startButtonText: {
    fontFamily: "SFProText-Semibold",
    fontSize: 13,
  },
});
