/* eslint-disable @typescript-eslint/no-require-imports */
import { StatusBar } from "expo-status-bar";
import {
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { COLORS } from "../../theme/typography";

type AppScreenBackground = "app" | "auth" | "onboarding";
type ResponsiveBackground = {
  landscape: ImageSourcePropType;
  portrait: ImageSourcePropType;
};

type AppScreenProps = {
  background?: AppScreenBackground;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  children?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  imageStyle?: StyleProp<ImageStyle>;
  statusBarStyle?: "auto" | "inverted" | "light" | "dark";
  style?: StyleProp<ViewStyle>;
  withSafeArea?: boolean;
};

const BACKGROUNDS: Record<AppScreenBackground, ResponsiveBackground> = {
  app: {
    landscape:
      require("../../assets/backgrounds/application-bg-landscape.webp") as ImageSourcePropType,
    portrait:
      require("../../assets/backgrounds/application-bg-portrait.webp") as ImageSourcePropType,
  },
  auth: {
    landscape:
      require("../../assets/backgrounds/onboarding-auth-landscape.webp") as ImageSourcePropType,
    portrait:
      require("../../assets/backgrounds/onboarding-auth-portrait.webp") as ImageSourcePropType,
  },
  onboarding: {
    landscape:
      require("../../assets/backgrounds/onboarding-main-landscape.webp") as ImageSourcePropType,
    portrait:
      require("../../assets/backgrounds/onboarding-main-portrait.webp") as ImageSourcePropType,
  },
};

export function AppScreen({
  background = "app",
  resizeMode = "cover",
  children,
  contentStyle,
  edges = ["top", "left", "right"],
  imageStyle,
  statusBarStyle = "light",
  style,
  withSafeArea = true,
}: AppScreenProps) {
  const Content = withSafeArea ? SafeAreaView : View;
  const { height, width } = useWindowDimensions();
  const source =
    width > height
      ? BACKGROUNDS[background].landscape
      : BACKGROUNDS[background].portrait;

  return (
    <ImageBackground
      source={source}
      style={[styles.root, style]}
      resizeMode={resizeMode}
      imageStyle={imageStyle}
    >
      <StatusBar style={statusBarStyle} />
      <Content
        edges={withSafeArea ? edges : undefined}
        style={[styles.content, contentStyle]}
      >
        {children}
      </Content>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  root: {
    backgroundColor: COLORS.navBarBackground,
    flex: 1,
    height: "100%",
    minHeight: "100%",
    width: "100%",
  },
});
