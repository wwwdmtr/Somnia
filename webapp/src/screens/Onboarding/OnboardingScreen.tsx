import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenName from "../../constants/ScreenName";

import type { AuthStackParamList } from "../../navigation/AuthStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  ScreenName.Onboarding
>;

export const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.description}>Добро пожаловать в Somnia ✨</Text>
      <Text style={styles.description}>
        Здесь ты можешь сохранять и анализировать свои сны.
      </Text>

      <Button
        title="Войти"
        onPress={() => navigation.navigate(ScreenName.SignIn)}
      />
      <Button
        title="Создать аккаунт"
        onPress={() => navigation.navigate(ScreenName.SignUp)}
      />
    </SafeAreaView>
  );
};

const COLORS = {
  background: "#fff",
  cardBackground: "#f7f7f7",
  descriptionColor: "#555",
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    marginTop: 24,
    padding: 14,
  },
  description: {
    color: COLORS.descriptionColor,
    fontSize: 16,
    margin: 12,
  },
});
