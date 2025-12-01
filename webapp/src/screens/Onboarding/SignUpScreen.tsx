import { useNavigation } from "@react-navigation/native";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SignUpForm } from "../../components/forms/SignUpForm";
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
    <ImageBackground
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require("../../assets/backgrounds/onboarding-auth.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={typography.h2_white100}>Добро пожаловать</Text>
          <Text style={typography.h2_white100}>в Somnia</Text>
        </View>
        <View style={styles.form}>
          <SignUpForm />
        </View>
        <View style={styles.bottomRow}>
          <Text style={typography.caption_white85}>Есть аккаунт?</Text>
          <Pressable onPress={() => navigation.navigate(ScreenName.SignIn)}>
            <Text style={typography.caption_link}>Войти</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  bottomRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    height: 22,
    justifyContent: "center",
    marginHorizontal: 40.5,
    marginTop: 18,
    width: 280,
  },
  container: {
    flex: 1,
    marginHorizontal: 16,
  },
  form: {
    marginTop: 40,
  },
  header: {
    height: 76,
    justifyContent: "space-between",
    marginTop: 44,
  },
});
