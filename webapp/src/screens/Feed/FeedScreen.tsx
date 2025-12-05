/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  Image,
  RefreshControl,
  FlatList,
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
      <View style={styles.centered}>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text>Error: {error?.message ?? "Unknown error"}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  const dreams = activeTab === "feed" ? data.dreams : [];

  const renderHeader = () => (
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
  );

  const renderItem = ({ item: dream }: { item: (typeof dreams)[number] }) => (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <Image
          source={require("../../assets/defaults/user-avatar.png")}
          style={styles.cardImage}
        />
        <View style={styles.postHeaderInfo}>
          <Text style={typography.body_white85}>@{dream.author.nickname}</Text>
          <Text style={typography.additionalInfo_white25}>
            {format(new Date(dream.createdAt), "dd.MM.yyyy")}
          </Text>
        </View>
      </View>

      <View style={styles.dream_info}>
        <Text style={typography.h3_white_85}>{dream.title}</Text>

        <Text style={typography.body_white100} numberOfLines={3}>
          {dream.text}...
        </Text>
      </View>

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
            source={require("../../assets/Icons/Activity/comments.png")}
            style={styles.action_img}
          />
          <Text style={typography.caption_white85}>комментариев</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (activeTab === "subs") {
      return (
        <View style={styles.emptyContainer}>
          <Text style={typography.h2_white100}>
            Модуль находится в разработке ✨
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={typography.body_white85}>
          В ленте пока нет снов. Будь первым, кто поделится 💫
        </Text>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={dreams}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
        />
      </SafeAreaView>
      <View pointerEvents="none" style={styles.tabBarStub}>
        <Image
          source={require("../../assets/Icons/tabIcons/feed-active.png")}
          style={styles.tabBarStubIcon}
        ></Image>
        <Image
          source={require("../../assets/Icons/tabIcons/add-dream-button.png")}
        ></Image>
        <Image
          source={require("../../assets/Icons/tabIcons/profile-inactive.png")}
          style={styles.tabBarStubIcon}
        ></Image>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },

  // ACTIONS
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

  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  dream_info: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 32,
  },

  header: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  list: {
    flex: 1,
  },

  listContent: {
    padding: 14,
    paddingBottom: 70,
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

  safeArea: {
    flex: 1,
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
    marginLeft: 32,
    width: 120,
  },
  segmentRight: {
    alignItems: "center",
    borderRadius: 99,
    height: 32,
    justifyContent: "center",
    marginRight: 32,
    width: 120,
  },
  tabBarStub: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 999,
    borderTopWidth: 0,
    bottom: 28,
    elevation: 0,
    flexDirection: "row",
    height: 60,
    justifyContent: "space-between",
    left: 13,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    position: "absolute",
    right: 13,
    shadowOpacity: 0,
  },
  tabBarStubIcon: {
    height: 24,
    marginHorizontal: 51,
    width: 24,
  },
});
