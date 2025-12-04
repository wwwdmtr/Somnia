import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trpc } from "../../lib/trpc";
import { typography, COLORS } from "../../theme/typography";

import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<FeedStackParamList, "Feed">;

export const AllDreamsScreen = () => {
  const { data, isLoading, error } = trpc.getDreams.useQuery();
  const [activeTab, setActiveTab] = useState<"feed" | "subs">("feed");

  const navigation = useNavigation<NavigationProp>();

  const handleOpenDream = (id: string) => {
    navigation.navigate("Dream", { id });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ImageBackground
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setActiveTab("feed")}
            style={[
              styles.segmentLeft,
              activeTab === "feed" && styles.segmentActive,
            ]}
          >
            <Text style={typography.caption_white85}>Лента</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("subs")}
            style={[
              styles.segmentRight,
              activeTab === "subs" && styles.segmentActive,
            ]}
          >
            <Text style={typography.caption_white85}>Подписки</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.container}>
          {activeTab === "feed" ? (
            // 👉 здесь рендерим ЛЕНТУ
            data.dreams.map((dream) => (
              <View key={dream.id} style={styles.card}>
                <Text style={styles.dreamTitle}>{dream.title}</Text>
                <Text style={styles.description}>{dream.author.nickname}</Text>
                <TouchableOpacity onPress={() => handleOpenDream(dream.id)}>
                  <Text>read more...</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.container}>
              <Text style={typography.h2_white100}>
                Модуль находится в разработке ✨
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const COLORS_mock = {
  background: "#fff",
  cardBackground: "#f7f7f7",
  descriptionColor: "#555",
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  card: {
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    padding: 14,
  },
  description: {
    color: COLORS_mock.descriptionColor,
    fontSize: 16,
  },
  dreamTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
    marginBottom: 20,
  },
  segmentActive: {
    backgroundColor: COLORS.buttonBackground,
  },
  segmentLeft: {
    alignItems: "center",

    borderRadius: 99,
    height: 32,
    justifyContent: "center",
    marginLeft: 40.5,
    width: 120,
  },
  segmentRight: {
    alignItems: "center",
    borderRadius: 99,
    height: 32,
    justifyContent: "center",
    marginRight: 40.5,
    width: 120,
  },
});
