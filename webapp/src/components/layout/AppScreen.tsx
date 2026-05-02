/* eslint-disable @typescript-eslint/no-require-imports */
import { StatusBar } from "expo-status-bar";
import {
  ImageBackground,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

type AppScreenBackground = "app" | "auth" | "onboarding";

type AppScreenProps = {
  background?: AppScreenBackground;
  children?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  imageStyle?: StyleProp<ImageStyle>;
  statusBarStyle?: "auto" | "inverted" | "light" | "dark";
  style?: StyleProp<ViewStyle>;
  withSafeArea?: boolean;
};

const BACKGROUNDS: Record<AppScreenBackground, ImageSourcePropType> = {
  app: require("../../assets/backgrounds/application-bg.png") as ImageSourcePropType,
  auth: require("../../assets/backgrounds/onboarding-auth.png") as ImageSourcePropType,
  onboarding:
    require("../../assets/backgrounds/onboarding-main.png") as ImageSourcePropType,
};

export function AppScreen({
  background = "app",
  children,
  contentStyle,
  edges = ["top", "left", "right"],
  imageStyle,
  statusBarStyle = "light",
  style,
  withSafeArea = true,
}: AppScreenProps) {
  const Content = withSafeArea ? SafeAreaView : View;

  return (
    <ImageBackground
      source={BACKGROUNDS[background]}
      style={[styles.root, style]}
      imageStyle={imageStyle}
    >
      <StatusBar style={statusBarStyle} />
      <Content edges={withSafeArea ? edges : undefined} style={contentStyle}>
        {children}
      </Content>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
