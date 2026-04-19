/* eslint-disable @typescript-eslint/no-require-imports */
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { isUserAdmin } from "@somnia/shared/src/utils/can";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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

import { PostCard } from "../../components/post/PostCard";
import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import ScreenName from "../../constants/ScreenName";
import { getAvatarSource } from "../../lib/avatar";
import { useAppContext } from "../../lib/ctx";
import {
  applyOptimisticLikeToPosts,
  applyServerLikeToPosts,
  usePostLikeMutation,
} from "../../lib/postLikeMutation";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { AdminStackParamList } from "../../navigation/AdminStackParamList";
import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { ProfileStackParamList } from "../../navigation/ProfileStackParamList";
import type { RootStackParamList } from "../../navigation/RootStackParamList";
import type { SearchStackParamList } from "../../navigation/SearchStackParamList";

type ProfileRouteParams = {
  [ScreenName.Profile]:
    | {
        userId?: string;
      }
    | undefined;
};

type ProfileRouteProp = RouteProp<ProfileRouteParams, ScreenName.Profile>;

type ProfileScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<
    FeedStackParamList &
      SearchStackParamList &
      ProfileStackParamList &
      AdminStackParamList,
    ScreenName.Profile
  >,
  NativeStackNavigationProp<RootStackParamList>
>;

export const ProfileScreen = () => {
  const route = useRoute<ProfileRouteProp>();
  const { me, isLoading: isMeLoading } = useAppContext();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const utils = trpc.useUtils();

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

  const targetUserId = route.params?.userId ?? me?.id ?? "";
  const shouldShowBackButton = Boolean(route.params?.userId);

  const profileQuery = trpc.getUserProfile.useQuery(
    {
      userId: targetUserId,
    },
    {
      enabled: Boolean(targetUserId),
    },
  );

  const postsQuery = trpc.getUserPosts.useQuery(
    {
      userId: targetUserId,
    },
    {
      enabled: Boolean(targetUserId),
    },
  );

  const setUserFollow = trpc.setUserFollow.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getUserProfile.invalidate({ userId: targetUserId }),
        me?.id
          ? utils.getUserProfile.invalidate({ userId: me.id })
          : Promise.resolve(),
        utils.getUserFollows.invalidate(),
      ]);
    },
  });

  type UserPostsData = NonNullable<
    ReturnType<typeof utils.getUserPosts.getData>
  >;

  const setPostLike = usePostLikeMutation<UserPostsData>({
    applyOptimistic: (old, variables) => {
      if (!old?.posts) {
        return old;
      }

      return {
        ...old,
        posts: applyOptimisticLikeToPosts(old.posts, variables),
      };
    },
    applyServer: (old, likeData) => {
      if (!old?.posts) {
        return old;
      }

      return {
        ...old,
        posts: applyServerLikeToPosts(old.posts, likeData),
      };
    },
    cancel: () => utils.getUserPosts.cancel({ userId: targetUserId }),
    getData: () => utils.getUserPosts.getData({ userId: targetUserId }),
    setData: (updater) =>
      utils.getUserPosts.setData({ userId: targetUserId }, updater),
  });

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([profileQuery.refetch(), postsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenPost = (id: string) => {
    navigation.navigate(ScreenName.Post, { id });
  };

  const handleOpenCommunity = (id: string) => {
    navigation.navigate(ScreenName.Community, { id });
  };

  const handleOpenProfile = (userId: string) => {
    if (userId === targetUserId) {
      return;
    }

    navigation.push(ScreenName.Profile, { userId });
  };

  if (isMeLoading || profileQuery.isLoading || postsQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.white85} size="large" />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (profileQuery.error || postsQuery.error || !profileQuery.data?.profile) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          {profileQuery.error?.message ??
            postsQuery.error?.message ??
            "Не удалось загрузить профиль"}
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  const profile = profileQuery.data.profile;
  const posts = postsQuery.data?.posts ?? [];

  const renderHeader = () => (
    <View style={styles.header}>
      {shouldShowBackButton ? (
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
            <Text style={typography.body_white85}>Назад</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Image
        source={getAvatarSource(profile.avatar, "big")}
        style={styles.avatar}
      />

      {profile.name ? (
        <Text style={typography.h3_white85}>{profile.name}</Text>
      ) : null}

      <View style={styles.headerUserNameRow}>
        <Text style={typography.body_white85}>@{profile.nickname}</Text>
        {profile.isMe ? (
          <TouchableOpacity
            onPress={() => navigation.navigate(ScreenName.UpdateProfile)}
          >
            <Image
              source={require("../../assets/Icons/decorIcons/edit-outline.png")}
              style={styles.editUserName}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {!profile.isMe ? (
        <TouchableOpacity
          style={[
            styles.followButton,
            profile.isFollowedByMe ? styles.unfollowButton : null,
          ]}
          onPress={() => {
            setUserFollow.mutate({
              userId: profile.id,
              isFollowing: !profile.isFollowedByMe,
            });
          }}
          disabled={setUserFollow.isPending}
        >
          <Text style={styles.followButtonText}>
            {setUserFollow.isPending
              ? "Сохраняем..."
              : profile.isFollowedByMe
                ? "Отписаться"
                : "Подписаться"}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={typography.h3_white85}>{profile.postsCount}</Text>
          <Text style={typography.body_white85}>постов</Text>
        </View>

        <TouchableOpacity
          style={styles.statItem}
          onPress={() =>
            navigation.navigate(ScreenName.UserConnections, {
              userId: profile.id,
              type: "followers",
            })
          }
        >
          <Text style={typography.h3_white85}>{profile.followersCount}</Text>
          <Text style={typography.body_white85}>подписчики</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statItem}
          onPress={() =>
            navigation.navigate(ScreenName.UserConnections, {
              userId: profile.id,
              type: "following",
            })
          }
        >
          <Text style={typography.h3_white85}>{profile.followingCount}</Text>
          <Text style={typography.body_white85}>подписки</Text>
        </TouchableOpacity>
      </View>

      {profile.isMe && isUserAdmin(me) ? (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(ScreenName.AdminStack, {
              screen: ScreenName.AdminHome,
            })
          }
        >
          <Text style={typography.body_white85}>Админка</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderItem = ({ item: post }: { item: (typeof posts)[number] }) => {
    return (
      <PostCard
        post={post}
        contentOrder="textFirst"
        imageHeight={180}
        onOpenPost={handleOpenPost}
        onOpenCommunity={handleOpenCommunity}
        onOpenUser={handleOpenProfile}
        onToggleLike={toggleLike}
        onOpenImageViewer={openImageViewer}
        openPostOnTextPress={false}
        showAuthor={false}
      />
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
        />

        <PostImageViewerModal
          visible={imageViewerState.isOpen}
          imagePublicIds={imageViewerState.images}
          initialIndex={imageViewerState.index}
          onClose={() =>
            setImageViewerState((prev) => ({
              ...prev,
              isOpen: false,
            }))
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 50,
    height: 100,
    width: 100,
  },
  backgroundImage: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  editUserName: {
    height: 24,
    width: 24,
  },
  followButton: {
    alignItems: "center",
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 36,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  followButtonText: {
    color: COLORS.white100,
    fontSize: 14,
    lineHeight: 20,
  },
  goBackWrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  header: {
    alignItems: "center",
    gap: 16,
    marginTop: 24,
    marginVertical: 36,
  },
  headerRow: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    justifyContent: "flex-start",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  headerUserNameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  listContent: {
    paddingBottom: 70,
  },
  safeArea: {
    flex: 1,
    marginBottom: 20,
    marginHorizontal: 14,
  },
  statItem: {
    alignItems: "center",
    minWidth: 90,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  unfollowButton: {
    backgroundColor: COLORS.postsCardBackground,
    borderColor: COLORS.white25,
    borderWidth: 1,
  },
});
