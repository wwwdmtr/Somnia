/* eslint-disable @typescript-eslint/no-explicit-any */
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { WEB_SHELL_WIDTH } from './src/constants/layout';
import { SentryUser } from './src/lib/SentryUser';
import { AppContextProvider } from './src/lib/ctx';
import { MixpanelUser } from './src/lib/mixpanel';
import { TrpcProvider } from './src/lib/trpc';
import { linking } from './src/navigation/linking';
import { RootNavigation } from './src/navigation/navigation';

const WEB_TEXTAREA_SCROLLBAR_STYLE_ID = 'somnia-hide-textarea-scrollbar';

export default function App() {
  const isWeb = Platform.OS === 'web';

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

    const styleElement = maybeDocument.createElement('style');
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
  background: '#fff',
  shadow: '#000',
};

const styles = StyleSheet.create({
  webRoot: {
    alignItems: 'center',
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: 'flex-start',
  },
  webShell: {
    borderRadius: 28,
    height: '100%',
    maxHeight: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    width: WEB_SHELL_WIDTH,
  },
});
