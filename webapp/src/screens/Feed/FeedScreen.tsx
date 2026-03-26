/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ImageBackground,
  Image,
  RefreshControl,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import { getAvatarSource } from "../../lib/avatar";
import { useMe } from "../../lib/ctx";
import { mixpanelTrackPostLike } from "../../lib/mixpanel";
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

  type LikeMutationContext = {
    previousData: PostsInfiniteData | undefined;
  };

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

  const handleMutate = async (variables: {
    postId: string;
    isLikedByMe: boolean;
  }): Promise<LikeMutationContext> => {
    await utils.getPosts.cancel();
    const previousData = utils.getPosts.getInfiniteData({ limit: 15 });

    utils.getPosts.setInfiniteData({ limit: 15 }, (old) => {
      if (!old) {
        return old;
      }

      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === variables.postId
              ? {
                  ...post,
                  isLikedByMe: variables.isLikedByMe,
                  likesCount: variables.isLikedByMe
                    ? post.likesCount + 1
                    : post.likesCount - 1,
                }
              : post,
          ),
        })),
      };
    });

    return { previousData };
  };

  const handleError = (
    _err: unknown,
    _variables: unknown,
    context: LikeMutationContext | undefined,
  ) => {
    if (context?.previousData) {
      utils.getPosts.setInfiniteData({ limit: 15 }, context.previousData);
    }
  };

  const handleSuccess = (data: {
    post: { id: string; likesCount: number; isLikedByMe: boolean };
  }) => {
    utils.getPosts.setInfiniteData({ limit: 15 }, (old) => {
      if (!old) {
        return old;
      }

      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === data.post.id
              ? {
                  ...post,
                  isLikedByMe: data.post.isLikedByMe,
                  likesCount: data.post.likesCount,
                }
              : post,
          ),
        })),
      };
    });

    mixpanelTrackPostLike(data.post);
  };

  const setPostLike = trpc.setPostLike.useMutation({
    onMutate: handleMutate,
    onError: handleError,
    onSuccess: handleSuccess,
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

  const renderItem = ({ item: post }: { item: (typeof posts)[number] }) => (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <Image
          source={getAvatarSource(post.author.avatar, "small")}
          style={styles.cardImage}
        />

        <View style={styles.postHeaderInfo}>
          <Text style={typography.body_white85}>@{post.author.nickname}</Text>
          <Text style={typography.additionalInfo_white25}>
            {format(new Date(post.createdAt), "dd.MM.yyyy")}
          </Text>
        </View>
      </View>

      {post.images.length === 1 ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => openImageViewer(post.images, 0)}
        >
          <Image
            source={{
              uri: getCloudinaryUploadUrl(post.images[0], "image", "large"),
            }}
            style={styles.singlePostPreviewImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : post.images.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.postImagesScroller}
          contentContainerStyle={styles.postImagesContainer}
        >
          {post.images.map((imagePublicId, index) => (
            <TouchableOpacity
              key={`${imagePublicId}-${index}`}
              activeOpacity={0.9}
              onPress={() => openImageViewer(post.images, index)}
            >
              <Image
                source={{
                  uri: getCloudinaryUploadUrl(imagePublicId, "image", "large"),
                }}
                style={styles.postPreviewImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
      <TouchableOpacity onPress={() => handleOpenPost(post.id)}>
        <View style={styles.dream_info}>
          <Text style={typography.h4_white_85}>{post.title}</Text>
          <Text style={typography.body_white100} numberOfLines={3}>
            {post.text}...
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleOpenPost(post.id)}
        style={styles.read_more}
      >
        <Text style={typography.caption_link}>Читать далее...</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.action}>
          <TouchableOpacity
            onPress={() => toggleLike(post.id, post.isLikedByMe)}
          >
            <Ionicons
              name={post.isLikedByMe ? "star" : "star-outline"}
              size={20}
              color={post.isLikedByMe ? "red" : "rgba(255,255,255,0.45)"}
            />
          </TouchableOpacity>
          <Text style={typography.caption_white85}>
            {post.likesCount} нравится
          </Text>
        </View>

        <View style={styles.action}>
          <Image
            source={require("../../assets/Icons/Activity/comments.png")}
            style={styles.action_img}
          />
          <TouchableOpacity onPress={() => handleOpenPost(post.id)}>
            <Text style={typography.caption_white85}>
              {post.commentsCount} комментариев
            </Text>
          </TouchableOpacity>
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
    borderRadius: 24,
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
  postImagesContainer: {
    gap: 10,
    paddingRight: 8,
  },
  postImagesScroller: {
    marginBottom: 16,
  },
  postPreviewImage: {
    backgroundColor: COLORS.imageEmptyFieldsBackground,
    borderRadius: 14,
    height: 220,
    width: 260,
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
  singlePostPreviewImage: {
    backgroundColor: COLORS.imageEmptyFieldsBackground,
    borderRadius: 14,
    height: 220,
    marginBottom: 16,
    width: "100%",
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
