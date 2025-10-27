// src/navigation/navigation.tsx
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import ScreenName from "../constants/ScreenName";
import TabName from "../constants/TabName";
import { DreamScreen } from "../screens/DreamScreen";
import { AllDreamsScreen } from "../screens/FeedScreen";
import { UserDreamScreen } from "../screens/UserDreams";

const FeedStack = createNativeStackNavigator();
function FeedStackNav() {
  return (
    <FeedStack.Navigator>
      <FeedStack.Screen name={ScreenName.Feed} component={AllDreamsScreen} />
      <FeedStack.Screen name={ScreenName.Dream} component={DreamScreen} />
    </FeedStack.Navigator>
  );
}

const UserDreamStack = createNativeStackNavigator();
function UserDreamStackNav() {
  return (
    <UserDreamStack.Navigator>
      <UserDreamStack.Screen
        name={ScreenName.UserDreams}
        component={UserDreamScreen}
      />
      <UserDreamStack.Screen name={ScreenName.Dream} component={DreamScreen} />
    </UserDreamStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export function AppNav() {
  return (
    <Tab.Navigator>
      <Tab.Screen name={TabName.FeedTab} component={FeedStackNav} />
      <Tab.Screen name={TabName.UserDreamTab} component={UserDreamStackNav} />
    </Tab.Navigator>
  );
}
