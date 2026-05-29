import { useRoute } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SignInForm } from "../../components/forms/SignInForm";
import { SignUpForm } from "../../components/forms/SignUpForm";
import { AppScreen } from "../../components/layout/AppScreen";
import ScreenName from "../../constants/ScreenName";
import { COLORS } from "../../theme/typography";

import type { RootStackParamList } from "../../navigation/RootStackParamList";
import type { RouteProp } from "@react-navigation/native";

type AuthMode = "signIn" | "signUp";
type AuthRouteProp = RouteProp<
  RootStackParamList,
  ScreenName.SignIn | ScreenName.SignUp
>;

const getInitialMode = (routeName: AuthRouteProp["name"]): AuthMode =>
  routeName === ScreenName.SignUp ? "signUp" : "signIn";

export const AuthScreen = () => {
  const route = useRoute<AuthRouteProp>();
  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(route.name));
  const isSignIn = mode === "signIn";

  return (
    <AppScreen background="auth" contentStyle={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.authPanel}>
          <View style={styles.modeSwitch}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSignIn }}
              onPress={() => setMode("signIn")}
              style={[styles.modeOption, isSignIn && styles.modeOptionActive]}
            >
              <Text
                style={[styles.modeText, isSignIn && styles.modeTextActive]}
              >
                ВХОД
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: !isSignIn }}
              onPress={() => setMode("signUp")}
              style={[styles.modeOption, !isSignIn && styles.modeOptionActive]}
            >
              <Text
                style={[styles.modeText, !isSignIn && styles.modeTextActive]}
              >
                РЕГИСТРАЦИЯ
              </Text>
            </Pressable>
          </View>

          <View style={styles.formSlot}>
            {isSignIn ? <SignInForm /> : <SignUpForm />}
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  authPanel: {
    alignSelf: "center",
    backgroundColor: COLORS.authPanelBackground,
    borderColor: COLORS.authPanelBorder,
    borderWidth: 1,
    maxWidth: 460,
    paddingBottom: 48,
    paddingHorizontal: 36,
    paddingTop: 52,
    width: "100%",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formSlot: {
    marginTop: 12,
  },
  modeOption: {
    alignItems: "center",
    borderBottomColor: COLORS.transparent,
    borderBottomWidth: 2,
    height: 34,
    justifyContent: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  modeOptionActive: {
    borderBottomColor: COLORS.brandBlueLight,
  },
  modeSwitch: {
    alignItems: "center",
    flexDirection: "row",
    gap: 24,
    justifyContent: "center",
    marginBottom: 8,
  },
  modeText: {
    color: COLORS.white100,
    fontFamily: "SFProText-Semibold",
    fontSize: 20,
    lineHeight: 28,
    opacity: 0.34,
  },
  modeTextActive: {
    opacity: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingTop: 56,
  },
});
