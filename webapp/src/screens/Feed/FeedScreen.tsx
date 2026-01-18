/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trpc } from "../../lib/trpc";
import { typography, COLORS } from "../../theme/typography";

import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<FeedStackParamList, "Feed">;

export const AllPostsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const utils = trpc.useUtils();

  const [activeTab, setActiveTab] = useState<"feed" | "subs">("feed");
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleOpenPost = (id: string) => {
    navigation.navigate("Post", { id });
  };

  const toggleLike = (postId: string, currentLikeState: boolean) => {
    setPostLike.mutate({
      postId,
      isLikedByMe: !currentLikeState,
    });
  };

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

  const renderItem = ({ item: post }: { item: (typeof posts)[number] }) => (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <Image
          source={require("../../assets/defaults/user-avatar.png")}
          style={styles.cardImage}
        />

        <View style={styles.postHeaderInfo}>
          <Text style={typography.body_white85}>@{post.author.nickname}</Text>
          <Text style={typography.additionalInfo_white25}>
            {format(new Date(post.createdAt), "dd.MM.yyyy")}
          </Text>
        </View>
      </View>

      <View style={styles.dream_info}>
        <Text style={typography.h4_white_85}>{post.title}</Text>
        <Text style={typography.body_white100} numberOfLines={3}>
          {post.text}...
        </Text>
      </View>

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
      </SafeAreaView>

      <View pointerEvents="none" style={styles.tabBarStub}>
        <Image
          source={require("../../assets/Icons/tabIcons/feed-active.png")}
          style={styles.tabBarStubIcon}
        />
        <Image
          source={require("../../assets/Icons/tabIcons/add-dream-button.png")}
        />
        <Image
          source={require("../../assets/Icons/tabIcons/profile-inactive.png")}
          style={styles.tabBarStubIcon}
        />
      </View>
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
