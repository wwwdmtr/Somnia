/* eslint-disable @typescript-eslint/no-require-imports */
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenName from "../../constants/ScreenName";
import { AdminStackParamList } from "../../navigation/AdminStackParamList";
import { COLORS, typography } from "../../theme/typography";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<
  AdminStackParamList,
  ScreenName.AdminHome
>;

export const AdminScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
            <Text style={typography.body_white85}>Назад</Text>
          </TouchableOpacity>
          <Text style={typography.body_white85}>
            Админ Панель ДОСТИЛИЗОВАТЬ!!
          </Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.AdminOptions}
            onPress={() => navigation.navigate(ScreenName.DeletedPosts)}
          >
            <Text style={typography.h4_white_85}>
              Посмотреть удаленные посты
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  AdminOptions: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 64,
    justifyContent: "center",
  },
  BackgroundImage: {
    flex: 1,
  },
  goBackWrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  headerContainer: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 6,
  },

  safeArea: {
    flex: 1,
    marginBottom: 20,
    marginHorizontal: 14,
  },
});
