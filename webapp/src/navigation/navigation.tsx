// src/navigation/navigation.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import ScreenName from "../constants/ScreenName";
import { DreamScreen } from "../screens/DreamScreen";
import { AllDreamsScreen } from "../screens/FeedScreen";

import { RootStackParamList } from "./RootStackParamList";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNav() {
  return (
    <Stack.Navigator id={undefined} initialRouteName="Feed">
      <Stack.Screen name={ScreenName.Feed} component={AllDreamsScreen} />
      <Stack.Screen name={ScreenName.Dream} component={DreamScreen} />
    </Stack.Navigator>
  );
}
