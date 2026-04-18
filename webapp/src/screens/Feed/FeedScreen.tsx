/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PostCard } from "../../components/post/PostCard";
import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import { useMe } from "../../lib/ctx";
import {
  applyOptimisticLikeToPosts,
  applyServerLikeToPosts,
  usePostLikeMutation,
} from "../../lib/postLikeMutation";
import { trpc } from "../../lib/trpc";
import { typography, COLORS } from "../../theme/typography";

import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<FeedStackParamList, "Feed">;

export const AllPostsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const utils = trpc.useUtils();
  const me = useMe();
  const isFeedFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<"feed" | "subs">("feed");
  const [refreshing, setRefreshing] = useState(false);
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
  }>({
    isOpen: false,
    images: [],
    index: 0,
  });

  type PostsInfiniteData = NonNullable<
    ReturnType<typeof utils.getPosts.getInfiniteData>
  >;

  const {
    data,
    error,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.getPosts.useInfiniteQuery(
    { limit: 15 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const setPostLike = usePostLikeMutation<PostsInfiniteData>({
    applyOptimistic: (old, variables) => {
      if (!old) {
        return old;
      }

      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: applyOptimisticLikeToPosts(page.posts, variables),
        })),
      };
    },
    applyServer: (old, likeData) => {
      if (!old) {
        return old;
      }

      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: applyServerLikeToPosts(page.posts, likeData),
        })),
      };
    },
    cancel: () => utils.getPosts.cancel(),
    getData: () => utils.getPosts.getInfiniteData({ limit: 15 }),
    setData: (updater) =>
      utils.getPosts.setInfiniteData({ limit: 15 }, updater),
  });

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data],
  );
  const isAuthorized = Boolean(me?.id);
  const { data: unreadNotificationsData, refetch: refetchUnreadNotifications } =
    trpc.getUnreadNotificationsCount.useQuery(
      {},
      {
        enabled: isAuthorized,
        refetchInterval: isFeedFocused && isAuthorized ? 30000 : false,
        refetchIntervalInBackground: false,
        staleTime: 15000,
      },
    );

  const hasUnreadNotifications =
    (unreadNotificationsData?.unreadCount ?? 0) > 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchUnreadNotifications()]);
    setRefreshing(false);
  }, [refetch, refetchUnreadNotifications]);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthorized) {
        return;
      }
      void refetchUnreadNotifications();
    }, [isAuthorized, refetchUnreadNotifications]),
  );

  const handleOpenPost = (id: string) => {
    navigation.navigate("Post", { id });
  };
  const handleOpenNotifications = () => {
    navigation.navigate("Notifications");
  };

  const toggleLike = (postId: string, currentLikeState: boolean) => {
    setPostLike.mutate({
      postId,
      isLikedByMe: !currentLikeState,
    });
  };

  const openImageViewer = (images: string[], index: number) => {
    setImageViewerState({
      isOpen: true,
      images,
      index,
    });
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <Text style={typography.h4_white_85}>{me.nickname}</Text>
        <TouchableOpacity
          onPress={handleOpenNotifications}
          style={styles.notificationsButton}
        >
          <Ionicons
            name={
              hasUnreadNotifications ? "notifications" : "notifications-outline"
            }
            size={22}
            color={COLORS.white85}
          />
          {hasUnreadNotifications && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </View>

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
    </View>
  );

  const renderItem = ({ item: post }: { item: (typeof posts)[number] }) => {
    return (
      <PostCard
        post={post}
        onOpenPost={handleOpenPost}
        onToggleLike={toggleLike}
        onOpenImageViewer={openImageViewer}
      />
    );
  };

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

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={activeTab === "feed" ? posts : []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          onEndReached={() => {
            if (!hasNextPage || isFetchingNextPage) {
              return;
            }

            fetchNextPage();
          }}
          onEndReachedThreshold={0.15}
        />
        <PostImageViewerModal
          visible={imageViewerState.isOpen}
          imagePublicIds={imageViewerState.images}
          initialIndex={imageViewerState.index}
          onClose={() =>
            setImageViewerState((prev) => ({ ...prev, isOpen: false }))
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },

  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
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
    paddingHorizontal: 6,
  },
  headerContainer: {
    marginBottom: 20,
  },

  listContent: {
    padding: 14,
    paddingBottom: 70,
  },

  notificationsButton: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    position: "relative",
    width: 38,
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
    marginHorizontal: 7,
    width: 165,
  },
  segmentRight: {
    alignItems: "center",
    borderRadius: 99,
    height: 32,
    justifyContent: "center",
    marginHorizontal: 7,
    width: 165,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 6,
  },
  unreadDot: {
    backgroundColor: COLORS.unreadDot,
    borderColor: COLORS.navBarBackground,
    borderRadius: 5,
    borderWidth: 1,
    height: 10,
    position: "absolute",
    right: 7,
    top: 7,
    width: 10,
  },
});
