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
import { AddPostScreen } from "../screens/AddPost/AddYourPost";
import { AdminScreen } from "../screens/Admin/AdminScreen";
import { DeletedPostsScreen } from "../screens/Admin/DeletedPosts";
import { AllPostsScreen } from "../screens/Feed/FeedScreen";
import { OnboardingScreen } from "../screens/Onboarding/OnboardingScreen";
import { SignInScreen } from "../screens/Onboarding/SignInScreen";
import { SignUpScreen } from "../screens/Onboarding/SignUpScreen";
import { PostScreen } from "../screens/Post/PostScreen";
import { UpdatePostScreen } from "../screens/Post/UpdatePostModalScreen";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { SignOutScreen } from "../screens/Profile/SignOutScreen";
import { UpdateProfileScreen } from "../screens/Profile/UpdateProfileScreen";
import { SearchScreen } from "../screens/Search/SearchScreen";

import { AddPostStackParamList } from "./AddPostStackParamList";
import { AdminStackParamList } from "./AdminStackParamList";
import { AuthStackParamList } from "./AuthStackParamList";
import { FeedStackParamList } from "./FeedStackParamList";
import { ProfileStackParamList } from "./ProfileStackParamList";
import { RootStackParamList } from "./RootStackParamList";
import { RootTabParamList } from "./RootTabParamList";
import { SearchStackParamList } from "./SearchStackParamList";

import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";

const FeedStack = createNativeStackNavigator<FeedStackParamList>();
function FeedStackNav() {
  return (
    <FeedStack.Navigator>
      <FeedStack.Screen
        name={ScreenName.Feed}
        component={AllPostsScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen
        name={ScreenName.Post}
        component={PostScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen
        name={ScreenName.EditPost}
        component={UpdatePostScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
    </FeedStack.Navigator>
  );
}

const AddPostStack = createNativeStackNavigator<AddPostStackParamList>();
function AddPostStackNav() {
  return (
    <AddPostStack.Navigator>
      <AddPostStack.Screen
        name={ScreenName.AddPost}
        component={AddPostScreen}
        options={{ headerShown: false }}
      />
    </AddPostStack.Navigator>
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
        name={ScreenName.Post}
        component={PostScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen
        name={ScreenName.EditPost}
        component={UpdatePostScreen}
        options={{
          presentation: "modal",
          title: "Edit dream",
          headerShown: false,
        }}
      />
    </ProfileStack.Navigator>
  );
}

const SearchStack = createNativeStackNavigator<SearchStackParamList>();
function SearchStackNav() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name={ScreenName.Search}
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name={ScreenName.Post}
        component={PostScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name={ScreenName.EditPost}
        component={UpdatePostScreen}
        options={{
          presentation: "modal",
          title: "Edit dream",
          headerShown: false,
        }}
      />
    </SearchStack.Navigator>
  );
}

function AdminStackNav() {
  return (
    <AdminStack.Navigator>
      <AdminStack.Screen
        name={ScreenName.AdminHome}
        component={AdminScreen}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name={ScreenName.DeletedPosts}
        component={DeletedPostsScreen}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name={ScreenName.Post}
        component={PostScreen}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name={ScreenName.EditPost}
        component={UpdatePostScreen}
        options={{
          presentation: "modal",
          title: "Edit dream",
          headerShown: false,
        }}
      />
    </AdminStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<RootTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

type IconPairs = {
  active: ImageSourcePropType;
  inactive: ImageSourcePropType;
};

const iconMap: Record<string, IconPairs> = {
  [TabName.FeedTab]: {
    active: require("../assets/Icons/tabIcons/feed-active.png"),
    inactive: require("../assets/Icons/tabIcons/feed-inactive.png"),
  },
  [TabName.AddPostTab]: {
    active: require("../assets/Icons/tabIcons/add-dream-button.png"),
    inactive: require("../assets/Icons/tabIcons/add-dream-button.png"),
  },
  [TabName.ProfileTab]: {
    active: require("../assets/Icons/tabIcons/profile-active.png"),
    inactive: require("../assets/Icons/tabIcons/profile-inactive.png"),
  },
  [TabName.SearchTab]: {
    active: require("../assets/Icons/tabIcons/feed-active.png"),
    inactive: require("../assets/Icons/tabIcons/feed-inactive.png"),
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
  ScreenName.Post,
  ScreenName.EditPost,
  ScreenName.AddPost,
  TabName.AddPostTab,
  ScreenName.UpdateProfile,
];

function getTabBarStyleForRoute(
  route: RouteProp<RootTabParamList, keyof RootTabParamList>,
): BottomTabNavigationOptions["tabBarStyle"] {
  const focusedRouteName = getFocusedRouteNameFromRoute(route) ?? route.name;

  const shouldHide = HIDE_TABBAR_SCREENS.includes(
    focusedRouteName as ScreenName,
  );

  if (shouldHide) {
    return {
      ...BASE_TAB_BAR_STYLE,
      opacity: 0,
      transform: [{ translateY: 80 }],
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
            const isCenter = route.name === TabName.AddPostTab;

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
      <Tab.Screen name={TabName.SearchTab} component={SearchStackNav} />
      <Tab.Screen name={TabName.AddPostTab} component={AddPostStackNav} />
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

  return me ? <RootStackNav /> : <AuthStackNav />;
}

function RootStackNav() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen
        name={ScreenName.RootTabs}
        component={AppNav}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name={ScreenName.AdminStack}
        component={AdminStackNav}
        options={{ headerShown: false }}
      />
    </RootStack.Navigator>
  );
}
