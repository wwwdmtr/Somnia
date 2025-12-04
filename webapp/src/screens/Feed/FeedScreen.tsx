import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns/format";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trpc } from "../../lib/trpc";
import { typography, COLORS } from "../../theme/typography";

import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<FeedStackParamList, "Feed">;

export const AllDreamsScreen = () => {
  const { data, isLoading, error, refetch } = trpc.getDreams.useQuery();
  const [activeTab, setActiveTab] = useState<"feed" | "subs">("feed");
  const [isLikeSet, setLike] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation<NavigationProp>();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

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
        <ScrollView
          showsVerticalScrollIndicator={false}
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{ paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
        >
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
          {activeTab === "feed" ? (
            data.dreams.map((dream) => (
              <View key={dream.id} style={styles.card}>
                <View style={styles.postHeader}>
                  <Image
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    source={require("../../assets/defaults/user-avatar.png")}
                    style={styles.cardImage}
                  />
                  <View style={styles.postHeaderInfo}>
                    <Text style={typography.body_white85}>
                      @{dream.author.nickname}
                    </Text>
                    <Text style={typography.additionalInfo_white25}>
                      {format(new Date(dream.createdAt), "dd.MM.yyyy")}
                    </Text>
                  </View>
                </View>
                <Text style={typography.h3_white_85}>{dream.title}</Text>
                <Text style={typography.body_white100} numberOfLines={3}>
                  {dream.text}...
                </Text>
                <TouchableOpacity
                  onPress={() => handleOpenDream(dream.id)}
                  style={styles.read_more}
                >
                  <Text style={typography.caption_link}>Читать далее...</Text>
                </TouchableOpacity>
                <View style={styles.actions}>
                  <View style={styles.action}>
                    <TouchableOpacity onPress={() => setLike(!isLikeSet)}>
                      {isLikeSet ? (
                        <Ionicons name="star" size={20} color="red" />
                      ) : (
                        <Ionicons
                          name="star-outline"
                          size={20}
                          color="rgba(255,255,255, 0.45)"
                        />
                      )}
                    </TouchableOpacity>
                    <Text style={typography.caption_white85}>нравится</Text>
                  </View>
                  <View style={styles.action}>
                    <Image
                      // eslint-disable-next-line @typescript-eslint/no-require-imports
                      source={require("../../assets/Icons/Activity/comments.png")}
                      style={styles.action_img}
                    />
                    <Text style={typography.caption_white85}>комментариев</Text>
                  </View>
                </View>
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

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  action: {
    flexDirection: "row",
    gap: 7,
  },
  action_img: {
    height: 24,
    width: 24,
  },
  actions: {
    flexDirection: "row",
    height: 22,
    justifyContent: "space-between",
    marginTop: 24,
    width: 277,
  },
  card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    marginBottom: 8,
    padding: 20,
  },
  cardImage: {
    height: 48,
    width: 48,
  },
  container: {
    flex: 1,
    padding: 14,
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
  postHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    height: 48,
    marginBottom: 24,
    width: "100%",
  },
  postHeaderInfo: {
    flexDirection: "column",
    gap: 4,
    justifyContent: "space-between",
  },
  read_more: {
    marginTop: 8,
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
