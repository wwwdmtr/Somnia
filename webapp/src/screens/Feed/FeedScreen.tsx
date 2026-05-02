import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppScreen } from "../../components/layout/AppScreen";
import { PostCard } from "../../components/post/PostCard";
import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import { useMe } from "../../lib/ctx";
import {
  applyOptimisticLikeToPosts,
  applyServerLikeToPosts,
  usePostLikeMutation,
} from "../../lib/postLikeMutation";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<FeedStackParamList, "Feed">;
const FEED_QUERY_KEY = { limit: 15 };
const MAX_INFINITE_PAGES = 10;

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

  const isAuthorized = Boolean(me?.id);
  const isFeedTab = activeTab === "feed";

  type FeedPostsInfiniteData = NonNullable<
    ReturnType<typeof utils.getPosts.getInfiniteData>
  >;
  type SubscribedPostsInfiniteData = NonNullable<
    ReturnType<typeof utils.getSubscribedPosts.getInfiniteData>
  >;

  const feedQuery = trpc.getPosts.useInfiniteQuery(FEED_QUERY_KEY, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: MAX_INFINITE_PAGES,
  });

  const subscribedQuery = trpc.getSubscribedPosts.useInfiniteQuery(
    FEED_QUERY_KEY,
    {
      enabled: isAuthorized && activeTab === "subs",
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
    },
  );

  const setFeedPostLike = usePostLikeMutation<FeedPostsInfiniteData>({
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
    getData: () => utils.getPosts.getInfiniteData(FEED_QUERY_KEY),
    setData: (updater) =>
      utils.getPosts.setInfiniteData(FEED_QUERY_KEY, updater),
  });

  const setSubscribedPostLike =
    usePostLikeMutation<SubscribedPostsInfiniteData>({
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
      cancel: () => utils.getSubscribedPosts.cancel(FEED_QUERY_KEY),
      getData: () => utils.getSubscribedPosts.getInfiniteData(FEED_QUERY_KEY),
      setData: (updater) =>
        utils.getSubscribedPosts.setInfiniteData(FEED_QUERY_KEY, updater),
    });

  const feedPosts = useMemo(
    () => feedQuery.data?.pages.flatMap((page) => page.posts) ?? [],
    [feedQuery.data],
  );
  const subscribedPosts = useMemo(
    () => subscribedQuery.data?.pages.flatMap((page) => page.posts) ?? [],
    [subscribedQuery.data],
  );

  const activePosts = isFeedTab ? feedPosts : subscribedPosts;
  const activeError = isFeedTab ? feedQuery.error : subscribedQuery.error;
  const activeIsLoading = isFeedTab
    ? feedQuery.isLoading
    : subscribedQuery.isLoading;
  const activeHasNextPage = isFeedTab
    ? feedQuery.hasNextPage
    : subscribedQuery.hasNextPage;
  const activeIsFetchingNextPage = isFeedTab
    ? feedQuery.isFetchingNextPage
    : subscribedQuery.isFetchingNextPage;

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
    try {
      await Promise.all([
        isFeedTab ? feedQuery.refetch() : subscribedQuery.refetch(),
        refetchUnreadNotifications(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [feedQuery, isFeedTab, refetchUnreadNotifications, subscribedQuery]);

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

  const handleOpenCommunity = (id: string) => {
    navigation.navigate("Community", { id });
  };
  const handleOpenUser = (userId: string) => {
    navigation.navigate("Profile", { userId });
  };

  const handleOpenNotifications = () => {
    navigation.navigate("Notifications");
  };

  const toggleLike = (postId: string, currentLikeState: boolean) => {
    const input = {
      postId,
      isLikedByMe: !currentLikeState,
    };

    if (isFeedTab) {
      setFeedPostLike.mutate(input);
      return;
    }

    setSubscribedPostLike.mutate(input);
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

  const renderItem = ({
    item: post,
  }: {
    item: (typeof activePosts)[number];
  }) => {
    return (
      <PostCard
        post={post}
        onOpenPost={handleOpenPost}
        onOpenCommunity={handleOpenCommunity}
        onOpenUser={handleOpenUser}
        onToggleLike={toggleLike}
        onOpenImageViewer={openImageViewer}
      />
    );
  };

  const renderEmpty = () => {
    if (!isFeedTab) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={typography.body_white85}>
            Подпишитесь на сообщества и пользователей, чтобы видеть их посты
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={typography.body_white85}>
          В ленте пока нет Постов. Будь первым, кто поделится
        </Text>
      </View>
    );
  };

  if (activeIsLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (activeError) {
    return (
      <View style={styles.centered}>
        <Text>Error: {activeError.message ?? "Unknown error"}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <AppScreen contentStyle={styles.safeArea}>
      <FlatList
        data={activePosts}
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
            tintColor={COLORS.white100}
          />
        }
        onEndReached={() => {
          if (!activeHasNextPage || activeIsFetchingNextPage) {
            return;
          }

          if (isFeedTab) {
            feedQuery.fetchNextPage();
            return;
          }

          subscribedQuery.fetchNextPage();
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
    </AppScreen>
  );
};

const styles = StyleSheet.create({
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
