import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { WEB_SHELL_HEIGHT, WEB_SHELL_WIDTH } from "./src/constants/layout";
import { SentryUser } from "./src/lib/SentryUser";
import { AppContextProvider } from "./src/lib/ctx";
import { MixpanelUser } from "./src/lib/mixpanel";
import { TrpcProvider } from "./src/lib/trpc";
import { linking } from "./src/navigation/linking";
import { RootNavigation } from "./src/navigation/navigation";

export default function App() {
  const isWeb = Platform.OS === "web";

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
          <View style={styles.webRoot}>
            <View style={styles.webShell}>{content}</View>
          </View>
        ) : (
          content
        )}
      </AppContextProvider>
    </TrpcProvider>
  );
}

const COLORS = {
  background: "#fff",
  shadow: "#000",
};

const styles = StyleSheet.create({
  webRoot: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
  },
  webShell: {
    borderRadius: 28,
    height: WEB_SHELL_HEIGHT,
    maxHeight: "100%",
    maxWidth: "100%",
    overflow: "hidden",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    width: WEB_SHELL_WIDTH,
  },
});
