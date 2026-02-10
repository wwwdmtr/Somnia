/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenName from "../../constants/ScreenName";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { AdminStackParamList } from "../../navigation/AdminStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<
  AdminStackParamList,
  ScreenName.DeletedPosts
>;

// Если хочешь — можешь принимать пропсы/навигацию и открывать Post
export const DeletedPostsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  const LIMIT = 10;

  const {
    data,
    error,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = trpc.getDeletedPosts.useInfiniteQuery(
    { limit: LIMIT },
    {
      // ВАЖНО: твой эндпоинт возвращает nextCursor
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      // по желанию, чтобы не дёргать лишний раз
      staleTime: 10_000,
    },
  );

  const handleOpenPost = (id: string) => {
    navigation.navigate(ScreenName.Post, { id });
  };

  const posts = useMemo(() => {
    const pages = data?.pages ?? [];
    return pages.flatMap((p) => p.posts);
  }, [data]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (!hasNextPage) {
      return;
    }
    if (isFetchingNextPage) {
      return;
    }
    fetchNextPage();
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          Error: {error.message ?? "Unknown error"}
        </Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.goBackWrapper}
      >
        <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
        <Text style={typography.body_white85}>Назад</Text>
      </TouchableOpacity>
      <Text style={typography.body_white85}>Удаленные посты</Text>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator />
          <Text style={typography.caption_white85}>Загружаю ещё…</Text>
        </View>
      );
    }

    if (!hasNextPage && posts.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={typography.caption_white85}>Больше нет</Text>
        </View>
      );
    }

    return <View />;
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={typography.body_white85}>Удалённых постов нет</Text>
    </View>
  );

  const renderItem = ({ item: post }: { item: (typeof posts)[number] }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOpenPost(post.id)}
      >
        <View style={styles.postHeader}>
          <Text style={typography.additionalInfo_white25}>
            {format(new Date(post.createdAt), "dd.MM.yyyy")}
          </Text>

          <View style={styles.rightMeta}>
            <Ionicons
              name="trash-outline"
              size={16}
              color="rgba(255,255,255,0.45)"
            />
            <Text style={typography.additionalInfo_white25}>#{post.seq}</Text>
          </View>
        </View>

        <View style={styles.dream_info}>
          <Text style={typography.h4_white_85}>{post.title}</Text>
          <Text style={typography.body_white100} numberOfLines={3}>
            {post.text}...
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="person-outline"
              size={18}
              color="rgba(255,255,255,0.45)"
            />
            <Text style={typography.caption_white85}>
              @{post.author.nickname}
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons
              name="star-outline"
              size={18}
              color="rgba(255,255,255,0.45)"
            />
            <Text style={typography.caption_white85}>
              {post.likesCount} нравится
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Image
              source={require("../../assets/Icons/Activity/comments.png")}
              style={styles.action_img}
            />
            <Text style={typography.caption_white85}>
              {post.commentsCount} комм.
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefetching}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          windowSize={7}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          removeClippedSubviews
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: { flex: 1 },

  action_img: {
    height: 20,
    width: 20,
  },

  card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    marginBottom: 8,
    padding: 20,
  },

  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },

  dream_info: {
    gap: 12,
  },

  empty: {
    alignItems: "center",
    marginTop: 40,
  },

  footer: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
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

  listContent: {
    paddingBottom: 70,
  },

  metaItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  postHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    width: "100%",
  },

  rightMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  safeArea: {
    flex: 1,
    marginBottom: 20,
    marginHorizontal: 14,
  },
});
