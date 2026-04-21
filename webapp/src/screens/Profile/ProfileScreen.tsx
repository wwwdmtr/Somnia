/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { isUserAdmin } from "@somnia/shared/src/utils/can";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PostCard } from "../../components/post/PostCard";
import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import { ReportModal } from "../../components/ui/ReportModal";
import ScreenName from "../../constants/ScreenName";
import { SHELL_CONTENT_WIDTH } from "../../constants/layout";
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

const PROFILE_POSTS_LIMIT = 15;
const MAX_INFINITE_PAGES = 10;
const SIDE_MENU_OVERLAY_BACKGROUND = "rgba(0,0,0,0.45)";
const FLAG_ACTION_ICON_COLOR = "rgba(255,255,255,0.62)";
const ADMIN_PANEL_BUTTON_BACKGROUND = "rgba(22, 104, 220, 0.22)";
const ADMIN_PANEL_BUTTON_BORDER = "rgba(22, 104, 220, 0.9)";
const ACTION_MENU_TOP_OFFSET = 24;
const ACTION_MENU_CARD_WIDTH = 236;

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
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

  const postsQueryKey = useMemo(
    () => ({
      userId: targetUserId,
      limit: PROFILE_POSTS_LIMIT,
    }),
    [targetUserId],
  );
  const postsQuery = trpc.getUserPosts.useInfiniteQuery(postsQueryKey, {
    enabled: Boolean(targetUserId),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: MAX_INFINITE_PAGES,
  });

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
  const setUserContentBlock = trpc.setUserContentBlock.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getUserProfile.invalidate({ userId: targetUserId }),
        utils.getPosts.invalidate(),
        utils.getSubscribedPosts.invalidate(),
        utils.getRatedPosts.invalidate(),
      ]);
    },
  });
  const createReport = trpc.createReport.useMutation({
    onSuccess: () => {
      setIsReportModalOpen(false);
      setIsActionsMenuOpen(false);
      Alert.alert("Готово", "Жалоба отправлена");
    },
  });

  type UserPostsData = NonNullable<
    ReturnType<typeof utils.getUserPosts.getInfiniteData>
  >;

  const setPostLike = usePostLikeMutation<UserPostsData>({
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
    cancel: () => utils.getUserPosts.cancel(postsQueryKey),
    getData: () => utils.getUserPosts.getInfiniteData(postsQueryKey),
    setData: (updater) =>
      utils.getUserPosts.setInfiniteData(postsQueryKey, updater),
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

  const handleToggleUserBlock = async () => {
    if (
      !me?.id ||
      !profileQuery.data?.profile ||
      profileQuery.data.profile.isMe
    ) {
      return;
    }

    const isBlocked = !profileQuery.data.profile.isBlockedByMe;

    try {
      await setUserContentBlock.mutateAsync({
        targetType: "USER",
        targetUserId: profileQuery.data.profile.id,
        isBlocked,
      });

      setIsActionsMenuOpen(false);
      if (isBlocked && navigation.canGoBack()) {
        navigation.goBack();
      }
      Alert.alert(
        "Готово",
        isBlocked ? "Пользователь заблокирован" : "Пользователь разблокирован",
      );
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error
          ? error.message
          : "Не удалось изменить блокировку",
      );
    }
  };

  const handleSubmitUserReport = async (description: string) => {
    if (!profileQuery.data?.profile || profileQuery.data.profile.isMe) {
      return;
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 10 || trimmedDescription.length > 500) {
      Alert.alert("Ошибка", "Текст жалобы должен быть от 10 до 500 символов");
      return;
    }

    try {
      await createReport.mutateAsync({
        targetType: "USER",
        targetUserId: profileQuery.data.profile.id,
        description: trimmedDescription,
      });
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error ? error.message : "Не удалось отправить жалобу",
      );
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

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.posts) ?? [],
    [postsQuery.data],
  );

  if (
    isMeLoading ||
    profileQuery.isLoading ||
    (postsQuery.isLoading && !postsQuery.data)
  ) {
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
  const canOpenActionsMenu = Boolean(me?.id && !profile.isMe);
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
          {canOpenActionsMenu ? (
            <TouchableOpacity onPress={() => setIsActionsMenuOpen(true)}>
              <Ionicons
                name="flag-outline"
                size={20}
                color={FLAG_ACTION_ICON_COLOR}
              />
            </TouchableOpacity>
          ) : null}
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
          style={styles.adminPanelButton}
          onPress={() =>
            navigation.navigate(ScreenName.AdminStack, {
              screen: ScreenName.AdminHome,
            })
          }
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={COLORS.white100}
          />
          <Text style={styles.adminPanelButtonText}>Админ панель</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderItem = ({ item: post }: { item: (typeof posts)[number] }) => {
    return (
      <PostCard
        post={post}
        onOpenPost={handleOpenPost}
        onOpenCommunity={handleOpenCommunity}
        onOpenUser={handleOpenProfile}
        onToggleLike={toggleLike}
        onOpenImageViewer={openImageViewer}
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={typography.body_white85}>
                У пользователя пока нет постов
              </Text>
            </View>
          }
          ListFooterComponent={
            postsQuery.isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={COLORS.white85} />
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          onEndReached={() => {
            if (!postsQuery.hasNextPage || postsQuery.isFetchingNextPage) {
              return;
            }

            postsQuery.fetchNextPage();
          }}
          onEndReachedThreshold={0.2}
        />

        <Modal
          visible={isActionsMenuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsActionsMenuOpen(false)}
        >
          <View style={styles.sideMenuOverlay}>
            <TouchableOpacity
              style={styles.sideMenuBackdrop}
              onPress={() => setIsActionsMenuOpen(false)}
            />
            <View style={styles.sideMenuShell}>
              <View style={styles.sideMenuContent}>
                {!profile.isMe ? (
                  <TouchableOpacity
                    style={styles.sideMenuButton}
                    disabled={setUserContentBlock.isPending}
                    onPress={() => {
                      void handleToggleUserBlock();
                    }}
                  >
                    <Text style={typography.body_white85}>
                      {profile.isBlockedByMe
                        ? "Разблокировать пользователя"
                        : "Заблокировать пользователя"}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {!profile.isMe && profile.canReportByMe ? (
                  <TouchableOpacity
                    style={styles.sideMenuButton}
                    onPress={() => {
                      setIsActionsMenuOpen(false);
                      setIsReportModalOpen(true);
                    }}
                  >
                    <Text style={typography.body_white85}>Пожаловаться</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>

        <ReportModal
          visible={isReportModalOpen}
          title="Жалоба на пользователя"
          isSubmitting={createReport.isPending}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={(description) => {
            void handleSubmitUserReport(description);
          }}
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
  adminPanelButton: {
    alignItems: "center",
    backgroundColor: ADMIN_PANEL_BUTTON_BACKGROUND,
    borderColor: ADMIN_PANEL_BUTTON_BORDER,
    borderRadius: 99,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 18,
    width: "100%",
  },
  adminPanelButtonText: {
    color: COLORS.white100,
    fontSize: 15,
    lineHeight: 22,
  },
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
  emptyState: {
    alignItems: "center",
    marginTop: 24,
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
  footerLoader: {
    alignItems: "center",
    marginVertical: 12,
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
    justifyContent: "space-between",
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
  sideMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sideMenuButton: {
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sideMenuContent: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 24,
    gap: 8,
    padding: 14,
    width: ACTION_MENU_CARD_WIDTH,
  },
  sideMenuOverlay: {
    alignItems: "center",
    backgroundColor: SIDE_MENU_OVERLAY_BACKGROUND,
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 14,
  },
  sideMenuShell: {
    alignItems: "flex-end",
    marginTop: ACTION_MENU_TOP_OFFSET,
    maxWidth: SHELL_CONTENT_WIDTH,
    width: "100%",
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
