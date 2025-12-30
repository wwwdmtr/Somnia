import { useNavigation } from "@react-navigation/native";
import { zCreatePostTrpcInput } from "@somnia/server/src/router/createPost/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Text } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { trpc } from "../../lib/trpc";
import { COLORS } from "../../theme/typography";
import { AppButton } from "../ui/AppButton";

import type { AddDreamStackParamList } from "../../navigation/AddDreamStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type DreamFormValues = z.infer<typeof zCreatePostTrpcInput>;

type AddDreamNavProp = NativeStackNavigationProp<
  AddDreamStackParamList,
  "AddDream"
>;

export const AddDreamForm = () => {
  const utils = trpc.useUtils();
  const navigation = useNavigation<AddDreamNavProp>();
  const createPost = trpc.createPost.useMutation({
    onSuccess: () => {
      utils.getPosts.invalidate();
    },
  });
  const formik = useFormik<DreamFormValues>({
    initialValues: {
      title: "",
      description: "some mock description",
      text: "",
    },
    validationSchema: toFormikValidationSchema(zCreatePostTrpcInput),
    onSubmit: async (values, { resetForm }) => {
      await createPost.mutateAsync(values);
      resetForm();
      navigation.goBack();
    },
  });

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Придумайте заголовок ..."
        placeholderTextColor={COLORS.white25}
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
        placeholder="Опишите, что вам снилось ..."
        placeholderTextColor={COLORS.white25}
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

      <AppButton
        title={formik.isSubmitting ? "Публикуем..." : "Опубликовать"}
        onPress={() => formik.handleSubmit()}
        style={styles.startButton}
        disabled={formik.isSubmitting || !formik.isValid}
      />
    </View>
  );
};

const styles = {
  container: {
    gap: 14,
    marginTop: 28,
    flex: 1,
    paddingBottom: 190,
  },
  input: {
    padding: 20,
    borderRadius: 32,
    backgroundColor: COLORS.postsCardBackground,
    height: 60,
    color: COLORS.white100,
  },
  textArea: {
    backgroundColor: COLORS.postsCardBackground,
    padding: 20,
    borderRadius: 32,
    height: 200,
    textAlignVertical: "top" as const,
    color: COLORS.white100,
  },
  inputError: {
    borderColor: "white",
  },
  errorText: {
    color: "white",
    fontSize: 12,
    marginBottom: 4,
  },
  startButton: {
    position: "absolute" as const,
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
};
