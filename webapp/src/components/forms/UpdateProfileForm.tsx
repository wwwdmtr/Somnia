import { zUpadteProfileTrpcInput } from "@somnia/shared/src/router/updateProfile/input";
import { TRPCClientError } from "@trpc/client";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Text, Platform } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { useAppFeedback } from "../../lib/appFeedback";
import { useMe } from "../../lib/ctx";
import { sentryCaptureException } from "../../lib/sentrySDK";
import { trpc } from "../../lib/trpc";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

type UpdatePorfileFormValues = z.infer<typeof zUpadteProfileTrpcInput>;

export const UpdateProfileForm = () => {
  const trpcUtils = trpc.useUtils();
  const feedback = useAppFeedback();
  const me = useMe();
  const updateProfile = trpc.updateProfile.useMutation();
  const formik = useFormik<UpdatePorfileFormValues>({
    initialValues: {
      nickname: me?.nickname ?? "",
      name: me?.name ?? "",
    },
    enableReinitialize: true,
    validationSchema: toFormikValidationSchema(zUpadteProfileTrpcInput),
    onSubmit: async (values, { setFieldError }) => {
      feedback.showLoading("Сохраняем профиль...");
      try {
        const updatedMe = await updateProfile.mutateAsync(values);
        trpcUtils.getMe.setData(undefined, { me: updatedMe });
        await trpcUtils.getUserProfile.invalidate({
          userId: updatedMe.id,
        });
        feedback.showSuccess("Профиль обновлен");
      } catch (err) {
        if (!(err instanceof TRPCClientError)) {
          sentryCaptureException(err);
        }

        const msg = err?.message || "";

        if (msg.includes("already exists")) {
          setFieldError("nickname", "Такой никнейм уже занят");
          feedback.showError("Такой никнейм уже занят", "Ошибка сохранения");
        } else {
          setFieldError("nickname", "Ошибка обновления профиля");
          feedback.showError(
            "Не удалось обновить профиль",
            "Ошибка сохранения",
          );
        }
      }
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
        placeholder="Ваш Никнейм"
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
      {formik.touched.nickname && formik.errors.nickname && (
        <Text style={styles.errorText}>{formik.errors.nickname}</Text>
      )}

      <TextInput
        placeholder="Ваше Имя"
        placeholderTextColor={COLORS.white25}
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

      <AppButton
        title={formik.isSubmitting ? "Сохраняем..." : "Обновить профиль"}
        onPress={() => formik.handleSubmit()}
        style={styles.startButton}
        disabled={formik.isSubmitting || !formik.isValid}
      />
    </View>
  );
};

const styles = {
  container: {
    gap: 20,
  },
  input: {
    backgroundColor: COLORS.inputBackgroundColor,
    borderColor: COLORS.inputBorderColor,
    borderRadius: 99,
    borderWidth: 1,
    color: COLORS.white100,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    ...webInputFocusReset,

    padding: 11,
  },

  inputError: {},
  errorText: {
    color: COLORS.white100,
    fontSize: 12,
    marginBottom: 4,
  },
  startButton: {
    height: 40,
    marginTop: 20,
  },
};
