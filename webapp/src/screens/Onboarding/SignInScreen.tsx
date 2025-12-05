import { useNavigation } from "@react-navigation/native";
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SignInForm } from "../../components/forms/SignInForm";
import ScreenName from "../../constants/ScreenName";
import { typography } from "../../theme/typography";

import type { AuthStackParamList } from "../../navigation/AuthStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  ScreenName.SignIn
>;

export const SignInScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  return (
    <ImageBackground
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require("../../assets/backgrounds/onboarding-auth.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={typography.h2_white100}>С возвращением</Text>
          <Text style={typography.h2_white100}>в Somnia</Text>
        </View>
        <View style={styles.form}>
          <SignInForm />
        </View>
        <View style={styles.bottomRow}>
          <Text style={typography.caption_white85}>Еще нет аккаунта?</Text>
          <Pressable onPress={() => navigation.navigate(ScreenName.SignUp)}>
            <Text style={typography.caption_link_underline}>
              Зарегистрироваться
            </Text>
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
    flex: 1,
    marginTop: 40,
  },
  header: {
    height: 76,
    justifyContent: "space-between",
    marginTop: 44,
  },
});
