import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SignUpForm } from "../../components/forms/SignUpForm";
import { AppScreen } from "../../components/layout/AppScreen";
import ScreenName from "../../constants/ScreenName";
import { typography } from "../../theme/typography";

import type { AuthStackParamList } from "../../navigation/AuthStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  ScreenName.SignUp
>;

export const SignUpScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  return (
    <AppScreen background="auth" contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={typography.h2_white100}>Добро пожаловать</Text>
        <Text style={typography.h2_white100}>в Универ</Text>
      </View>
      <View style={styles.form}>
        <SignUpForm />
      </View>
      <View style={styles.bottomRow}>
        <Text style={typography.caption_white85}>Есть аккаунт?</Text>
        <Pressable onPress={() => navigation.navigate(ScreenName.SignIn)}>
          <Text style={typography.caption_link_underline}>Войти</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    height: 22,
    justifyContent: "center",
    marginBottom: 10,
    marginHorizontal: 40.5,
    marginTop: 18,
    width: 280,
  },
  container: {
    flex: 1,
    marginHorizontal: 16,
  },
  form: {
    flex: 1,
    marginTop: 40,
  },
  header: {
    height: 76,
    justifyContent: "space-between",
    marginTop: 44,
  },
});
