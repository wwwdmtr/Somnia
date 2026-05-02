import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import { AppScreen } from "../../components/layout/AppScreen";
import { AppButton } from "../../components/ui/AppButton";
import ScreenName from "../../constants/ScreenName";
import { typography } from "../../theme/typography";

import type { AuthStackParamList } from "../../navigation/AuthStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  ScreenName.Onboarding
>;

export const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  return (
    <AppScreen background="onboarding" contentStyle={styles.container}>
      <View style={styles.spacer} />
      <View style={styles.logo}>
        <Text style={typography.h1_white100}>Универ</Text>
        <Text style={typography.body_white85}>Пожалуй лучшая соцсеть</Text>
      </View>

      <AppButton
        title="Начать"
        onPress={() => navigation.navigate(ScreenName.SignIn)}
        style={styles.startButton}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logo: {
    height: 78,
    justifyContent: "space-between",
    marginBottom: 132,
    width: 244,
  },
  spacer: {
    flex: 1,
  },
  startButton: {
    height: 40,
    marginBottom: 50,
    width: "auto",
  },
});
