// src/navigation/navigation.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { AllDreamsScreen } from './screens/AllDreamsScreen';
import { DreamScreen } from './screens/DreamScreen';

export type RootStackParamList = {
  Feed: undefined;
  Dream: { nickname: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNav() {
  return (
    <Stack.Navigator id={undefined} initialRouteName="Feed">
      <Stack.Screen name="Feed" component={AllDreamsScreen} />
      <Stack.Screen name="Dream" component={DreamScreen} />
    </Stack.Navigator>
  );
}
