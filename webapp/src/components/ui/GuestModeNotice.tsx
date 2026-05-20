import { Ionicons } from "@expo/vector-icons";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useOpenAuthScreen } from "../../lib/useOpenAuthScreen";
import { COLORS, typography } from "../../theme/typography";

import { AppButton } from "./AppButton";

type GuestModeNoticeProps = {
  message?: string;
  style?: StyleProp<ViewStyle>;
  title?: string;
};

export const GuestModeNotice = ({
  message = "Вы находитесь в гостевом режиме. Авторизуйтесь, чтобы продолжить.",
  style,
  title = "Гостевой режим",
}: GuestModeNoticeProps) => {
  const openAuthScreen = useOpenAuthScreen();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <Ionicons
          name="lock-closed-outline"
          size={30}
          color={COLORS.white100}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[typography.h4_white_85, styles.title]}>{title}</Text>
        <Text style={[typography.body_white85, styles.message]}>{message}</Text>
      </View>
      <AppButton
        title="Войти или зарегистрироваться"
        onPress={openAuthScreen}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 44,
  },
  container: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
    maxWidth: 420,
    padding: 20,
    width: "100%",
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: COLORS.buttonBackgroundMuted,
    borderRadius: 999,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  message: {
    textAlign: "center",
  },
  textWrap: {
    gap: 8,
  },
  title: {
    textAlign: "center",
  },
});
