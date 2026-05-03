/* eslint-disable @typescript-eslint/no-explicit-any */
import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WEB_APP_SHELL_MAX_WIDTH } from "./src/constants/layout";
import { SentryUser } from "./src/lib/SentryUser";
import { AppContextProvider } from "./src/lib/ctx";
import { MixpanelUser } from "./src/lib/mixpanel";
import { TrpcProvider } from "./src/lib/trpc";
import { linking } from "./src/navigation/linking";
import { RootNavigation } from "./src/navigation/navigation";
import { COLORS } from "./src/theme/typography";

const WEB_TEXTAREA_SCROLLBAR_STYLE_ID = "somnia-hide-textarea-scrollbar";
const MOBILE_STANDALONE_SCREEN_WIDTH_LIMIT = 480;
const WEB_SHELL_BORDER_RADIUS_BREAKPOINT = 650;
const WEB_SHELL_BORDER_RADIUS = 20;

function isStandaloneWebApp() {
  const maybeWindow = (globalThis as { window?: Window }).window;
  if (!maybeWindow) {
    return false;
  }

  const maybeNavigator = maybeWindow.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    maybeNavigator.standalone === true ||
    maybeWindow.matchMedia?.("(display-mode: standalone)").matches === true
  );
}

function getWebViewportHeight() {
  const maybeWindow = (globalThis as { window?: Window }).window;
  if (!maybeWindow) {
    return 0;
  }

  const maybeDocument = (globalThis as { document?: Document }).document;
  const canUseStandaloneScreenHeight =
    isStandaloneWebApp() &&
    Number.isFinite(maybeWindow.screen?.width) &&
    maybeWindow.screen.width <= MOBILE_STANDALONE_SCREEN_WIDTH_LIMIT;
  const heights = [
    maybeWindow.innerHeight,
    maybeWindow.visualViewport?.height,
    maybeDocument?.documentElement?.clientHeight,
    canUseStandaloneScreenHeight ? maybeWindow.screen?.height : undefined,
  ].filter((value): value is number => Number.isFinite(value) && value > 0);

  if (heights.length === 0) {
    return 0;
  }

  return Math.round(Math.max(...heights));
}

export default function App() {
  const isWeb = Platform.OS === "web";
  const { width: windowWidth } = useWindowDimensions();
  const [webViewportHeight, setWebViewportHeight] = useState<number>(() =>
    isWeb ? getWebViewportHeight() : 0,
  );
  const webShellBorderRadius =
    windowWidth >= WEB_SHELL_BORDER_RADIUS_BREAKPOINT
      ? WEB_SHELL_BORDER_RADIUS
      : 0;

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const maybeDocument = (globalThis as { document?: any }).document;
    if (!maybeDocument) {
      return;
    }

    if (maybeDocument.getElementById(WEB_TEXTAREA_SCROLLBAR_STYLE_ID)) {
      return;
    }

    const styleElement = maybeDocument.createElement("style");
    styleElement.id = WEB_TEXTAREA_SCROLLBAR_STYLE_ID;
    styleElement.textContent = `
      textarea {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      textarea::-webkit-scrollbar {
        display: none;
        height: 0;
        width: 0;
      }
    `;

    maybeDocument.head?.appendChild(styleElement);
  }, [isWeb]);

  useEffect(() => {
    if (!isWeb) {
      return;
    }

    const maybeWindow = (globalThis as { window?: Window }).window;
    if (!maybeWindow) {
      return;
    }

    const syncViewportHeight = () => {
      const nextHeight = getWebViewportHeight();
      if (nextHeight > 0) {
        setWebViewportHeight(nextHeight);
      }
    };

    syncViewportHeight();

    maybeWindow.addEventListener("resize", syncViewportHeight);
    maybeWindow.visualViewport?.addEventListener("resize", syncViewportHeight);

    return () => {
      maybeWindow.removeEventListener("resize", syncViewportHeight);
      maybeWindow.visualViewport?.removeEventListener(
        "resize",
        syncViewportHeight,
      );
    };
  }, [isWeb]);

  const content = (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <RootNavigation />
      </NavigationContainer>
    </SafeAreaProvider>
  );
  return (
    <TrpcProvider>
      <AppContextProvider>
        <MixpanelUser />
        <SentryUser />
        {isWeb ? (
          <View
            style={[
              styles.webRoot,
              webViewportHeight > 0
                ? { height: webViewportHeight, minHeight: webViewportHeight }
                : null,
            ]}
          >
            <View
              style={[
                styles.webShell,
                { borderRadius: webShellBorderRadius },
                webViewportHeight > 0
                  ? { height: webViewportHeight, maxHeight: webViewportHeight }
                  : null,
              ]}
            >
              {content}
            </View>
          </View>
        ) : (
          content
        )}
      </AppContextProvider>
    </TrpcProvider>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    alignItems: "center",
    backgroundColor: COLORS.campusMist,
    flex: 1,
    justifyContent: "flex-start",
    marginBottom: 0,
    marginTop: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  webShell: {
    height: "100%",
    marginBottom: 0,
    marginTop: 0,
    maxHeight: "100%",
    maxWidth: WEB_APP_SHELL_MAX_WIDTH,
    overflow: "hidden",
    paddingBottom: 0,
    paddingTop: 0,
    shadowColor: COLORS.shadowInk,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    width: "100%",
  },
});
