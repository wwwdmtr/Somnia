import { zSignUpTrpcInput } from "@somnia/server/src/router/signUp/input";
import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Button, Text } from "react-native";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { trpc } from "../lib/trpc";

const signUpFormSchema = zSignUpTrpcInput
  .extend({
    passwordConfirmation: z
      .string({ message: "Password confirmation is required" })
      .min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export const SignUpForm = () => {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const signUp = trpc.signUp.useMutation({
    onSuccess: () => {
      console.info("Sign up successful");
      setErrorMessage(null);

      // You can add additional logic here, such as navigation or displaying a success message
    },
    onError: (err) => {
      setErrorMessage(err.message); // tRPC передаёт сообщение сюда
    },
  });
  const formik = useFormik<SignUpFormValues>({
    initialValues: {
      nickname: "",
      password: "",
      passwordConfirmation: "",
    },
    validationSchema: toFormikValidationSchema(signUpFormSchema),
    onSubmit: async (values, { resetForm }) => {
      const { nickname, password } = values;
      await signUp.mutateAsync({ nickname, password });
      resetForm();
    },
  });

  return (
    <View>
      <TextInput
        placeholder="Your nickname"
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
        placeholder="Your password"
        value={formik.values.password}
        onChangeText={(text) => formik.setFieldValue("password", text)}
        onBlur={() => formik.setFieldTouched("password")}
        secureTextEntry
        style={[
          styles.input,
          formik.touched.password && formik.errors.password
            ? styles.inputError
            : null,
        ]}
      />
      {formik.touched.password && formik.errors.password && (
        <Text style={styles.errorText}>{formik.errors.password}</Text>
      )}

      <TextInput
        placeholder="Confirm your password"
        value={formik.values.passwordConfirmation}
        onChangeText={(text) =>
          formik.setFieldValue("passwordConfirmation", text)
        }
        onBlur={() => formik.setFieldTouched("passwordConfirmation")}
        secureTextEntry
        style={[
          styles.input,
          formik.touched.passwordConfirmation &&
          formik.errors.passwordConfirmation
            ? styles.inputError
            : null,
        ]}
      />
      {formik.touched.passwordConfirmation &&
        formik.errors.passwordConfirmation && (
          <Text style={styles.errorText}>
            {formik.errors.passwordConfirmation}
          </Text>
        )}

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <Button title="Sign Up" onPress={() => formik.handleSubmit()} />
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
    marginBottom: 20,
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
