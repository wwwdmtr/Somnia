/* eslint-disable @typescript-eslint/no-require-imports */
import { StatusBar } from "expo-status-bar";
import {
  ImageBackground,
  Platform,
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
  withBottomEdgeBlur?: boolean;
};

const AUTH_BACKGROUND_BLUR_RADIUS = 4;
const BOTTOM_EDGE_BLUR_HEIGHT = 70;
const WEB_BOTTOM_EDGE_BLUR_STYLE = {
  backgroundImage:
    "linear-gradient(to bottom, rgba(6, 23, 42, 0) 0%, rgba(6, 23, 42, 0.08) 45%, rgba(6, 23, 42, 0.58) 100%)",
} as ViewStyle;

const BACKGROUNDS: Record<AppScreenBackground, ResponsiveBackground> = {
  app: {
    landscape:
      require("../../assets/backgrounds/app-bg-landscape.webp") as ImageSourcePropType,
    portrait:
      require("../../assets/backgrounds/app-bg-portrait.webp") as ImageSourcePropType,
  },
  auth: {
    landscape:
      require("../../assets/backgrounds/onboarding-bg-landscape.webp") as ImageSourcePropType,
    portrait:
      require("../../assets/backgrounds/onboarding-bg-portrait.webp") as ImageSourcePropType,
  },
  onboarding: {
    landscape:
      require("../../assets/backgrounds/onboarding-bg-landscape.webp") as ImageSourcePropType,
    portrait:
      require("../../assets/backgrounds/onboarding-bg-portrait.webp") as ImageSourcePropType,
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
  withBottomEdgeBlur = false,
}: AppScreenProps) {
  const Content = withSafeArea ? SafeAreaView : View;
  const { height, width } = useWindowDimensions();
  const source =
    width > height
      ? BACKGROUNDS[background].landscape
      : BACKGROUNDS[background].portrait;

  return (
    <ImageBackground
      blurRadius={
        background === "auth" ? AUTH_BACKGROUND_BLUR_RADIUS : undefined
      }
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
      {withBottomEdgeBlur ? (
        <View
          pointerEvents="none"
          style={[
            styles.bottomEdgeBlur,
            Platform.OS === "web"
              ? WEB_BOTTOM_EDGE_BLUR_STYLE
              : styles.nativeBottomEdgeBlur,
          ]}
        />
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bottomEdgeBlur: {
    bottom: 0,
    height: BOTTOM_EDGE_BLUR_HEIGHT,
    left: 0,
    position: "absolute",
    right: 0,
  },
  content: {
    flex: 1,
  },
  nativeBottomEdgeBlur: {
    backgroundColor: COLORS.bottomEdgeBlurFallback,
  },
  root: {
    backgroundColor: COLORS.navBarBackground,
    flex: 1,
    height: "100%",
    minHeight: "100%",
    width: "100%",
  },
});
