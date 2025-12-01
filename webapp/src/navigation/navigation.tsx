/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import React from "react";
import { Text } from "react-native";

import ScreenName from "../constants/ScreenName";
import TabName from "../constants/TabName";
import { useAppContext } from "../lib/ctx";
import { UserDreamScreen } from "../screens/AddDream/AddYourDream";
import { DreamScreen } from "../screens/Dream/DreamScreen";
import { UpdateDreamScreen } from "../screens/Dream/UpdateDreamModalScreen";
import { AllDreamsScreen } from "../screens/Feed/FeedScreen";
import { OnboardingScreen } from "../screens/Onboarding/OnboardingScreen";
import { SignInScreen } from "../screens/Onboarding/SignInScreen";
import { SignUpScreen } from "../screens/Onboarding/SignUpScreen";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { SignOutScreen } from "../screens/Profile/SignOutScreen";
import { UpdateProfileScreen } from "../screens/Profile/UpdateProfileScreen";

import { AuthStackParamList } from "./AuthStackParamList";
import { FeedStackParamList } from "./FeedStackParamList";
import { ProfileStackParamList } from "./ProfileStackParamList";
import { RootTabParamList } from "./RootTabParamList";
import { UserDreamStackParamList } from "./UserDreamStackParamList";

import type { ComponentProps } from "react";

const FeedStack = createNativeStackNavigator<FeedStackParamList>();
function FeedStackNav() {
  return (
    <FeedStack.Navigator>
      <FeedStack.Screen
        name={ScreenName.Feed}
        component={AllDreamsScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen name={ScreenName.Dream} component={DreamScreen} />
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

const UserDreamStack = createNativeStackNavigator<UserDreamStackParamList>();
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

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStackNav() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name={ScreenName.Profile}
        component={ProfileScreen}
      />
      <ProfileStack.Screen
        name={ScreenName.SignOut}
        component={SignOutScreen}
      />
      <ProfileStack.Screen
        name={ScreenName.UpdateProfile}
        component={UpdateProfileScreen}
      />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNav() {
  return (
    <Tab.Navigator
      initialRouteName={TabName.FeedTab}
      screenOptions={({ route }) => {
        type IoniconName = ComponentProps<typeof Ionicons>["name"];
        const iconMap: Record<
          string,
          { active: IoniconName; inactive: IoniconName }
        > = {
          [TabName.FeedTab]: { active: "home", inactive: "home-outline" },
          [TabName.UserDreamTab]: {
            active: "clipboard",
            inactive: "clipboard-outline",
          },
          [TabName.ProfileTab]: {
            active: "person",
            inactive: "person-outline",
          },
        };
        return {
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 34,
            height: 60,
            borderRadius: 999,
            backgroundColor: "#CCC",
            borderTopWidth: 0,
            elevation: 0, // Android
            shadowOpacity: 0, // iOS
            paddingTop: 0,
            paddingBottom: 0,
          },
          tabBarItemStyle: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarIconStyle: {
            margin: 0,
            padding: 0,
          },
          tabBarActiveTintColor: "#3B82F6",
          tabBarInactiveTintColor: "rgba(255,255,255,0.35)",
          tabBarIcon: ({ focused, size }) => {
            const pair = iconMap[route.name] ?? {
              active: "ellipse",
              inactive: "ellipse-outline",
            };
            const name = focused ? pair.active : pair.inactive;
            return <Ionicons name={name} size={size} />;
          },
        };
      }}
    >
      <Tab.Screen name={TabName.FeedTab} component={FeedStackNav} />
      <Tab.Screen name={TabName.UserDreamTab} component={UserDreamStackNav} />
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
