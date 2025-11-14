import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

import ScreenName from "../constants/ScreenName";
import TabName from "../constants/TabName";
import { trpc } from "../lib/trpc";

import type { ProfileStackParamList } from "../navigation/ProfileStackParamList";
import type { RootTabParamList } from "../navigation/RootTabParamList";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

type Props = NativeStackScreenProps<ProfileStackParamList, ScreenName.SignOut>;

export const SignOutScreen: React.FC<Props> = ({ navigation }) => {
  const utils = trpc.useUtils();

  React.useEffect(() => {
    const parentNavigation =
      navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();

    const signOut = async () => {
      try {
        await SecureStore.deleteItemAsync("token");
        await utils.invalidate();
      } catch (error) {
        console.error("Error during sign out", error);
      } finally {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: ScreenName.Profile }],
          });
        }
        parentNavigation?.navigate(TabName.FeedTab, {
          screen: ScreenName.Feed,
        });
      }
    };

    void signOut();
  }, [navigation, utils]);

  return (
    <View>
      <ActivityIndicator />
      <Text>Выходим из аккаунта...</Text>
    </View>
  );
};
