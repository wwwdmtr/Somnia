import { zSignInTrpcInput } from '@somnia/server/src/router/signIn/input';
import * as SecureStore from 'expo-secure-store';
import { useFormik } from 'formik';
import React from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';

import { trpc } from '../lib/trpc';

type SignInFormValues = z.infer<typeof zSignInTrpcInput>;

export const SignInForm = () => {
  const trpcUtils = trpc.useUtils();

  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const signIn = trpc.signIn.useMutation({
    onSuccess: () => {
      console.info('Sign in successful');
      setErrorMessage(null);
      // You can add additional logic here, such as navigation or displaying a success message
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });
  const formik = useFormik<SignInFormValues>({
    initialValues: {
      nickname: '',
      password: '',
    },
    validationSchema: toFormikValidationSchema(zSignInTrpcInput),
    onSubmit: async (values, { resetForm }) => {
      const { nickname, password } = values;
      const { token } = await signIn.mutateAsync({ nickname, password });
      await SecureStore.setItemAsync('token', token);
      trpcUtils.invalidate();
      resetForm();
    },
  });

  return (
    <View>
      <TextInput
        placeholder="Your nickname"
        value={formik.values.nickname}
        onChangeText={(text) => formik.setFieldValue('nickname', text)}
        onBlur={() => formik.setFieldTouched('nickname')}
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
        secureTextEntry
        value={formik.values.password}
        onChangeText={(text) => formik.setFieldValue('password', text)}
        onBlur={() => formik.setFieldTouched('password')}
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

      {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

      <Button
        title={formik.isSubmitting ? 'Signing In...' : 'Sign In'}
        onPress={() => formik.handleSubmit()}
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
    marginBottom: 20,
  },
  textArea: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    height: 200,
    textAlignVertical: 'top' as const,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 4,
  },
};
