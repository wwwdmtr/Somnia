/* eslint-disable @typescript-eslint/no-require-imports */

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  getFocusedRouteNameFromRoute,
  RouteProp,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import React from "react";
import { Text, View, Image, ImageSourcePropType } from "react-native";

import ScreenName from "../constants/ScreenName";
import TabName from "../constants/TabName";
import { useAppContext } from "../lib/ctx";
import { AddDreamScreen } from "../screens/AddDream/AddYourDream";
import { DreamScreen } from "../screens/Dream/DreamScreen";
import { UpdateDreamScreen } from "../screens/Dream/UpdateDreamModalScreen";
import { AllDreamsScreen } from "../screens/Feed/FeedScreen";
import { OnboardingScreen } from "../screens/Onboarding/OnboardingScreen";
import { SignInScreen } from "../screens/Onboarding/SignInScreen";
import { SignUpScreen } from "../screens/Onboarding/SignUpScreen";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { SignOutScreen } from "../screens/Profile/SignOutScreen";
import { UpdateProfileScreen } from "../screens/Profile/UpdateProfileScreen";

import { AddDreamStackParamList } from "./AddDreamStackParamList";
import { AuthStackParamList } from "./AuthStackParamList";
import { FeedStackParamList } from "./FeedStackParamList";
import { ProfileStackParamList } from "./ProfileStackParamList";
import { RootTabParamList } from "./RootTabParamList";

import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

const FeedStack = createNativeStackNavigator<FeedStackParamList>();
function FeedStackNav() {
  return (
    <FeedStack.Navigator>
      <FeedStack.Screen
        name={ScreenName.Feed}
        component={AllDreamsScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen
        name={ScreenName.Dream}
        component={DreamScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen
        name={ScreenName.EditDream}
        component={UpdateDreamScreen}
        options={{
          presentation: "modal",
          title: "Edit dream",
        }}
      />
    </FeedStack.Navigator>
  );
}

const AddDreamStack = createNativeStackNavigator<AddDreamStackParamList>();
function AddDreamStackNav() {
  return (
    <AddDreamStack.Navigator>
      <AddDreamStack.Screen
        name={ScreenName.AddDream}
        component={AddDreamScreen}
        options={{ headerShown: false }}
      />
    </AddDreamStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStackNav() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name={ScreenName.Profile}
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name={ScreenName.SignOut}
        component={SignOutScreen}
      />
      <ProfileStack.Screen
        name={ScreenName.UpdateProfile}
        component={UpdateProfileScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen
        name={ScreenName.Dream}
        component={DreamScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen
        name={ScreenName.EditDream}
        component={UpdateDreamScreen}
        options={{
          presentation: "modal",
          title: "Edit dream",
        }}
      />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<RootTabParamList>();

type IconPairs = {
  active: ImageSourcePropType;
  inactive: ImageSourcePropType;
};

const iconMap: Record<string, IconPairs> = {
  [TabName.FeedTab]: {
    active: require("../assets/Icons/tabIcons/feed-active.png"),
    inactive: require("../assets/Icons/tabIcons/feed-inactive.png"),
  },
  [TabName.AddDreamTab]: {
    active: require("../assets/Icons/tabIcons/add-dream-button.png"),
    inactive: require("../assets/Icons/tabIcons/add-dream-button.png"),
  },
  [TabName.ProfileTab]: {
    active: require("../assets/Icons/tabIcons/profile-active.png"),
    inactive: require("../assets/Icons/tabIcons/profile-inactive.png"),
  },
};

export const BASE_TAB_BAR_STYLE = {
  position: "absolute",
  marginHorizontal: 13,
  bottom: 28,
  height: 60,

  borderRadius: 999,
  backgroundColor: "#070F32",
  borderTopWidth: 0,
  elevation: 0, // Android
  shadowOpacity: 0, // iOS
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
} satisfies BottomTabNavigationOptions["tabBarStyle"];

const HIDE_TABBAR_SCREENS: Array<ScreenName | TabName> = [
  ScreenName.Dream,
  ScreenName.EditDream,
  ScreenName.AddDream,
  TabName.AddDreamTab,
  ScreenName.UpdateProfile,
];

function getTabBarStyleForRoute(
  route: RouteProp<RootTabParamList, keyof RootTabParamList>,
): BottomTabNavigationOptions["tabBarStyle"] {
  const focusedRouteName =
    getFocusedRouteNameFromRoute(route) ??
    // when stack не инициализировался, getFocusedRouteNameFromRoute вернет undefined.
    // для AddDream берем имя таба, чтобы скрыть кнопку.
    route.name;

  const shouldHide = HIDE_TABBAR_SCREENS.includes(
    focusedRouteName as ScreenName,
  );

  if (shouldHide) {
    return {
      ...BASE_TAB_BAR_STYLE,
      // визуально убираем таббар, но не размонтируем
      opacity: 0,
      transform: [{ translateY: 80 }],
      // можно добавить, чтобы не ловил клики
      pointerEvents: "none",
    };
  }

  return BASE_TAB_BAR_STYLE;
}

export function AppNav() {
  return (
    <Tab.Navigator
      initialRouteName={TabName.FeedTab}
      screenOptions={({ route }) => {
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: getTabBarStyleForRoute(route),
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarIconStyle: {
            margin: 0,
            padding: 0,
          },
          tabBarIcon: ({ focused, size }) => {
            const pair = iconMap[route.name];
            const source = focused ? pair.active : pair.inactive;
            const isCenter = route.name === TabName.AddDreamTab;

            if (isCenter) {
              return (
                <View
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 32,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={source}
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{ width: 44, height: 44 }}
                    resizeMode="contain"
                  />
                </View>
              );
            }

            return (
              <Image
                source={source}
                style={{ width: size, height: size }}
                resizeMode="contain"
              />
            );
          },
        };
      }}
    >
      <Tab.Screen name={TabName.FeedTab} component={FeedStackNav} />
      <Tab.Screen name={TabName.AddDreamTab} component={AddDreamStackNav} />
      <Tab.Screen name={TabName.ProfileTab} component={ProfileStackNav} />
    </Tab.Navigator>
  );
}

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthStackNav() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name={ScreenName.Onboarding}
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name={ScreenName.SignIn}
        component={SignInScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name={ScreenName.SignUp}
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

export function RootNavigation() {
  const { me, isLoading } = useAppContext();

  const [fontsLoaded] = useFonts({
    "SFProText-Regular": require("../assets/fonts/SFProText-Regular.ttf"),
    "SFProText-Medium": require("../assets/fonts/SFProText-Medium.ttf"),
    "SFProText-Semibold": require("../assets/fonts/SFProText-Semibold.ttf"),
    "SFProText-Bold": require("../assets/fonts/SFProText-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  if (isLoading) {
    return null;
  }

  return me ? <AppNav /> : <AuthStackNav />;
}
