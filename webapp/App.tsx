import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { TrpcProvider } from "./src/lib/trpc";
import { AppNav } from "./src/navigation/navigation";

export default function App() {
  return (
    <TrpcProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNav />
        </NavigationContainer>
      </SafeAreaProvider>
    </TrpcProvider>
  );
}
