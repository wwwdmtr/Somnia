import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";

import { AppScreen } from "../../components/layout/AppScreen";
import ScreenName from "../../constants/ScreenName";
import TabName from "../../constants/TabName";
import { mixpanelTrackSignOut } from "../../lib/mixpanel";
import { clearToken } from "../../lib/tokenStorage";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { ProfileStackParamList } from "../../navigation/ProfileStackParamList";
import type { RootTabParamList } from "../../navigation/RootTabParamList";

type Props = NativeStackScreenProps<ProfileStackParamList, ScreenName.SignOut>;

export const SignOutScreen: React.FC<Props> = ({ navigation }) => {
  const utils = trpc.useUtils();

  React.useEffect(() => {
    const parentNavigation =
      navigation.getParent<BottomTabNavigationProp<RootTabParamList>>();

    const signOut = async () => {
      try {
        mixpanelTrackSignOut();
        await clearToken();
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
    <AppScreen contentStyle={styles.container}>
      <ActivityIndicator color={COLORS.white85} />
      <Text style={typography.body_white85}>Выходим из аккаунта...</Text>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: 12,
    justifyContent: "center",
  },
});
