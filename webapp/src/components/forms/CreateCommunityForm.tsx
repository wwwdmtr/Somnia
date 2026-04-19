import { zCreateCommunityTrpcInput } from "@somnia/shared/src/router/createCommunity/input";
import { useFormik } from "formik";
import React, { useState } from "react";
import {
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import {
  pickPostImageFiles,
  uploadPostImagesToCloudinary,
  validatePostImageFiles,
  type PickedPostImageFile,
} from "../../lib/postImages";
import { trpc } from "../../lib/trpc";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

const zCreateCommunityFormSchema = zCreateCommunityTrpcInput.pick({
  name: true,
  description: true,
});

type CreateCommunityFormValues = z.infer<typeof zCreateCommunityFormSchema>;

type CreatedCommunity = {
  avatar: string | null;
  id: string;
  name: string;
};

type CreateCommunityFormProps = {
  onCancel?: () => void;
  onCreated: (community: CreatedCommunity) => void;
};

export const CreateCommunityForm = ({
  onCancel,
  onCreated,
}: CreateCommunityFormProps) => {
  const utils = trpc.useUtils();
  const prepareCloudinaryUpload = trpc.prepareCloudinaryUpload.useMutation();
  const createCommunity = trpc.createCommunity.useMutation();

  const [pendingAvatar, setPendingAvatar] =
    useState<PickedPostImageFile | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formik = useFormik<CreateCommunityFormValues>({
    initialValues: {
      name: "",
      description: "",
    },
    validationSchema: toFormikValidationSchema(zCreateCommunityFormSchema),
    onSubmit: async (values, { resetForm }) => {
      setSubmitError(null);
      setIsUploadingAvatar(true);

      try {
        let avatarPublicId: string | null = null;
        if (pendingAvatar) {
          const uploadedAvatarIds = await uploadPostImagesToCloudinary({
            files: [pendingAvatar],
            prepareCloudinaryUpload: () =>
              prepareCloudinaryUpload.mutateAsync({
                type: "avatar",
              }),
          });

          avatarPublicId = uploadedAvatarIds[0] ?? null;
        }

        const { community } = await createCommunity.mutateAsync({
          name: values.name,
          description: values.description,
          avatar: avatarPublicId,
        });

        await utils.getMyPublishingIdentities.invalidate();

        resetForm();
        setPendingAvatar(null);
        onCreated({
          id: community.id,
          name: community.name,
          avatar: community.avatar ?? null,
        });
      } catch (error) {
        if (error instanceof Error) {
          setSubmitError(error.message);
        } else {
          setSubmitError("Не удалось создать сообщество");
        }
      } finally {
        setIsUploadingAvatar(false);
      }
    },
  });

  const handlePickAvatar = async () => {
    setSubmitError(null);

    try {
      const pickedImages = await pickPostImageFiles();
      const nextAvatar = pickedImages[0];
      if (!nextAvatar) {
        return;
      }

      const errorText = validatePostImageFiles([nextAvatar]);
      if (errorText) {
        setSubmitError(errorText);
        return;
      }

      setPendingAvatar(nextAvatar);
    } catch (error) {
      if (error instanceof Error && error.message.includes("permission")) {
        setSubmitError("Нужен доступ к галерее для выбора аватарки");
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Не удалось выбрать аватарку");
      }
    }
  };

  const isBusy =
    formik.isSubmitting ||
    isUploadingAvatar ||
    prepareCloudinaryUpload.isPending ||
    createCommunity.isPending;

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Имя сообщества"
        placeholderTextColor={COLORS.white25}
        value={formik.values.name}
        onChangeText={(text) => {
          setSubmitError(null);
          formik.setFieldValue("name", text);
        }}
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
        onChangeText={(text) => {
          setSubmitError(null);
          formik.setFieldValue("description", text);
        }}
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

      <View style={styles.avatarBlock}>
        <Text style={styles.avatarTitle}>Аватарка сообщества</Text>
        <AppButton
          title="Добавить аватарку"
          onPress={() => void handlePickAvatar()}
          style={styles.addAvatarButton}
          disabled={isBusy}
        />

        {pendingAvatar ? (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: pendingAvatar.previewUri }}
              style={styles.preview}
            />
            <TouchableOpacity
              onPress={() => setPendingAvatar(null)}
              disabled={isBusy}
              style={styles.removeAvatarButton}
            >
              <Text style={styles.removeAvatarText}>Удалить</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <AppButton
        title={isBusy ? "Создаем..." : "Создать сообщество"}
        onPress={() => formik.handleSubmit()}
        style={styles.actionButton}
        disabled={isBusy || !formik.isValid}
      />

      {onCancel ? (
        <AppButton
          title="Вернуться к созданию поста"
          onPress={onCancel}
          style={styles.actionButton}
          disabled={isBusy}
          TextStyle={styles.secondaryButtonText}
        />
      ) : null}
    </View>
  );
};

const styles = {
  actionButton: {
    height: 40,
    marginTop: 6,
  },
  addAvatarButton: {
    height: 40,
  },
  avatarBlock: {
    gap: 8,
  },
  avatarTitle: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  container: {
    gap: 12,
    marginTop: 28,
    paddingBottom: 24,
  },
  descriptionInput: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 20,
    color: COLORS.white100,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
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
    height: 60,
    padding: 20,
  },
  inputError: {
    borderColor: COLORS.white85,
    borderWidth: 1,
  },
  preview: {
    borderRadius: 16,
    height: 80,
    width: 80,
  },
  previewWrap: {
    alignItems: "center" as const,
    flexDirection: "row" as const,
    gap: 12,
  },
  removeAvatarButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeAvatarText: {
    color: COLORS.white85,
    fontSize: 12,
  },
  secondaryButtonText: {
    color: COLORS.white25,
    fontSize: 16,
  },
};
