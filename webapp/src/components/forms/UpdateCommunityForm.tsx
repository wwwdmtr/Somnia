import { zUpdateCommunityTrpcInput } from "@somnia/shared/src/router/updateCommunity/input";
import { TRPCClientError } from "@trpc/client";
import { useFormik } from "formik";
import React from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { sentryCaptureException } from "../../lib/sentrySDK";
import { trpc } from "../../lib/trpc";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

const zUpdateCommunityFormSchema = zUpdateCommunityTrpcInput.pick({
  name: true,
  description: true,
});

type UpdateCommunityFormValues = z.infer<typeof zUpdateCommunityFormSchema>;

type UpdatedCommunity = {
  avatar: string | null;
  description: string;
  id: string;
  name: string;
};

type UpdateCommunityFormProps = {
  communityId: string;
  description: string;
  name: string;
  onUpdated: (community: UpdatedCommunity) => void;
};

export const UpdateCommunityForm = ({
  communityId,
  description,
  name,
  onUpdated,
}: UpdateCommunityFormProps) => {
  const updateCommunity = trpc.updateCommunity.useMutation();

  const formik = useFormik<UpdateCommunityFormValues>({
    initialValues: {
      name,
      description,
    },
    enableReinitialize: true,
    validationSchema: toFormikValidationSchema(zUpdateCommunityFormSchema),
    onSubmit: async (values, { setFieldError }) => {
      try {
        const { community } = await updateCommunity.mutateAsync({
          communityId,
          name: values.name,
          description: values.description,
        });

        onUpdated(community);
      } catch (error) {
        if (!(error instanceof TRPCClientError)) {
          sentryCaptureException(error);
        }

        const message = error instanceof Error ? error.message : "";
        if (message.includes("уже существует")) {
          setFieldError("name", "Сообщество с таким именем уже существует");
          return;
        }

        setFieldError("name", "Не удалось обновить сообщество");
      }
    },
  });

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Имя сообщества"
        placeholderTextColor={COLORS.white25}
        value={formik.values.name}
        onChangeText={(text) => formik.setFieldValue("name", text)}
        onBlur={() => formik.setFieldTouched("name")}
        style={[
          styles.input,
          formik.touched.name && formik.errors.name ? styles.inputError : null,
        ]}
      />
      {formik.touched.name && formik.errors.name ? (
        <Text style={styles.errorText}>{formik.errors.name}</Text>
      ) : null}

      <TextInput
        placeholder="Описание сообщества"
        placeholderTextColor={COLORS.white25}
        value={formik.values.description}
        onChangeText={(text) => formik.setFieldValue("description", text)}
        onBlur={() => formik.setFieldTouched("description")}
        multiline
        style={[
          styles.descriptionInput,
          formik.touched.description && formik.errors.description
            ? styles.inputError
            : null,
        ]}
      />
      {formik.touched.description && formik.errors.description ? (
        <Text style={styles.errorText}>{formik.errors.description}</Text>
      ) : null}

      <AppButton
        title={formik.isSubmitting ? "Сохраняем..." : "Сохранить изменения"}
        onPress={() => formik.handleSubmit()}
        style={styles.submitButton}
        disabled={formik.isSubmitting || !formik.isValid}
      />
    </View>
  );
};

const styles = {
  container: {
    gap: 12,
  },
  descriptionInput: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 20,
    color: COLORS.white100,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    ...webInputFocusReset,
    minHeight: 110,
    padding: 16,
    textAlignVertical: "top" as const,
  },
  errorText: {
    color: COLORS.white85,
    fontSize: 12,
  },
  input: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    color: COLORS.white100,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    ...webInputFocusReset,
    height: 60,
    padding: 20,
  },
  inputError: {
    borderColor: COLORS.white85,
    borderWidth: 1,
  },
  submitButton: {
    height: 40,
    marginTop: 6,
  },
};
