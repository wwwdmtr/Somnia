import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppContextProvider } from './src/lib/ctx';
import { TrpcProvider } from './src/lib/trpc';
import { RootNavigation } from './src/navigation/navigation';

export default function App() {
  return (
    <TrpcProvider>
      <AppContextProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigation />
          </NavigationContainer>
        </SafeAreaProvider>
      </AppContextProvider>
    </TrpcProvider>
  );
}
