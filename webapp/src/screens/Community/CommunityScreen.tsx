/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
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
import { useMe } from "../../lib/ctx";
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
import type { SearchStackParamList } from "../../navigation/SearchStackParamList";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const MAX_INFINITE_PAGES = 10;
const SIDE_MENU_OVERLAY_BACKGROUND = "rgba(0,0,0,0.45)";
const FLAG_ACTION_ICON_COLOR = "rgba(255,255,255,0.62)";
const ACTION_MENU_TOP_OFFSET = 14;
const ACTION_MENU_CARD_WIDTH = 236;

type CommunityRouteParams = {
  [ScreenName.Community]: {
    id: string;
  };
};

type CommunityRouteProp = RouteProp<CommunityRouteParams, ScreenName.Community>;

type CommunityNavProp = NativeStackNavigationProp<
  FeedStackParamList &
    SearchStackParamList &
    ProfileStackParamList &
    AdminStackParamList,
  ScreenName.Community
>;

export const CommunityScreen = () => {
  const route = useRoute<CommunityRouteProp>();
  const navigation = useNavigation<CommunityNavProp>();
  const utils = trpc.useUtils();
  const me = useMe();
  const [refreshing, setRefreshing] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
  }>({
    isOpen: false,
    images: [],
    index: 0,
  });

  const communityId = route.params.id;
  const communityQuery = trpc.getCommunity.useQuery({ id: communityId });

  const postsQueryKey = {
    communityId,
    limit: 15,
  };

  const postsQuery = trpc.getCommunityPosts.useInfiniteQuery(postsQueryKey, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: MAX_INFINITE_PAGES,
  });
  const setCommunitySubscription = trpc.setCommunitySubscription.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getCommunity.invalidate({ id: communityId }),
        utils.getSubscribedPosts.invalidate(),
      ]);
    },
  });
  const setUserContentBlock = trpc.setUserContentBlock.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getCommunity.invalidate({ id: communityId }),
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

  type CommunityPostsInfiniteData = NonNullable<
    ReturnType<typeof utils.getCommunityPosts.getInfiniteData>
  >;

  const setPostLike = usePostLikeMutation<CommunityPostsInfiniteData>({
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
    cancel: () => utils.getCommunityPosts.cancel(postsQueryKey),
    getData: () => utils.getCommunityPosts.getInfiniteData(postsQueryKey),
    setData: (updater) =>
      utils.getCommunityPosts.setInfiniteData(postsQueryKey, updater),
  });

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.posts) ?? [],
    [postsQuery.data],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([communityQuery.refetch(), postsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenPost = (id: string) => {
    navigation.navigate(ScreenName.Post, { id });
  };

  const toggleLike = (postId: string, currentLikeState: boolean) => {
    setPostLike.mutate({
      postId,
      isLikedByMe: !currentLikeState,
    });
  };

  const handleOpenCommunity = (id: string) => {
    if (id === communityId) {
      return;
    }

    navigation.push(ScreenName.Community, { id });
  };

  const handleOpenProfile = (userId: string) => {
    navigation.push(ScreenName.Profile, { userId });
  };

  const openImageViewer = (images: string[], index: number) => {
    setImageViewerState({
      isOpen: true,
      images,
      index,
    });
  };

  if (communityQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.white85} size="large" />
      </View>
    );
  }

  if (communityQuery.error || !communityQuery.data?.community) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          {communityQuery.error?.message ?? "Сообщество не найдено"}
        </Text>
      </View>
    );
  }

  const community = communityQuery.data.community;
  const isManagedCommunity =
    community.myRole === "OWNER" || community.myRole === "MODERATOR";
  const subscriptionButtonTitle = isManagedCommunity
    ? community.myRole === "OWNER"
      ? "Вы владелец"
      : "Вы модератор"
    : community.isSubscribedByMe
      ? "Отписаться"
      : "Подписаться";
  const canOpenActionsMenu = Boolean(me?.id && !isManagedCommunity);
  const canReportCommunity = Boolean(
    me?.id &&
      community.owner?.id &&
      community.owner.id !== me.id &&
      !isManagedCommunity,
  );

  const handleToggleCommunityBlock = async () => {
    if (!community.id || !me?.id || isManagedCommunity) {
      return;
    }

    const isBlocked = !community.isBlockedByMe;

    try {
      await setUserContentBlock.mutateAsync({
        targetType: "COMMUNITY",
        targetCommunityId: community.id,
        isBlocked,
      });

      setIsActionsMenuOpen(false);
      if (isBlocked && navigation.canGoBack()) {
        navigation.goBack();
      }
      Alert.alert(
        "Готово",
        isBlocked ? "Сообщество заблокировано" : "Сообщество разблокировано",
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

  const handleSubmitCommunityReport = async (description: string) => {
    if (!community.owner?.id || !canReportCommunity) {
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
        targetUserId: community.owner.id,
        description: trimmedDescription,
      });
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error ? error.message : "Не удалось отправить жалобу",
      );
    }
  };

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.goBackWrapper}
        >
          <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
          <Text style={typography.body_white85}>Назад</Text>
        </TouchableOpacity>
        {isManagedCommunity ? (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(ScreenName.UpdateCommunity, {
                id: community.id,
              })
            }
            style={styles.settingsButton}
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color={COLORS.white85}
            />
          </TouchableOpacity>
        ) : canOpenActionsMenu ? (
          <TouchableOpacity
            onPress={() => setIsActionsMenuOpen(true)}
            style={styles.settingsButton}
          >
            <Ionicons
              name="flag-outline"
              size={19}
              color={FLAG_ACTION_ICON_COLOR}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.communityCard}>
        <Image
          source={getAvatarSource(community.avatar, "big")}
          style={styles.communityAvatar}
        />
        <View style={styles.communityNameRow}>
          <Text style={typography.h3_white85}>{community.name}</Text>
          {community.isVerified ? (
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={COLORS.white85}
            />
          ) : null}
        </View>
        {community.description ? (
          <Text style={styles.communityDescription}>
            {community.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={typography.caption_white85}>
            Постов: {community.postsCount}
          </Text>
          <Text style={typography.caption_white85}>
            Участников: {community.membersCount}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            community.isSubscribedByMe && !isManagedCommunity
              ? styles.unsubscribeButton
              : null,
          ]}
          disabled={isManagedCommunity || setCommunitySubscription.isPending}
          onPress={() => {
            setCommunitySubscription.mutate({
              communityId: community.id,
              isSubscribed: !community.isSubscribedByMe,
            });
          }}
        >
          <Text style={styles.subscribeButtonText}>
            {setCommunitySubscription.isPending
              ? "Сохраняем..."
              : subscriptionButtonTitle}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.postsTitle}>Посты сообщества</Text>
    </View>
  );

  const renderEmpty = () => {
    if (postsQuery.isLoading) {
      return (
        <View style={styles.centeredInList}>
          <ActivityIndicator color={COLORS.white85} />
        </View>
      );
    }

    return (
      <View style={styles.centeredInList}>
        <Text style={typography.body_white85}>
          У сообщества пока нет постов
        </Text>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.backgroundImage}
    >
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onOpenPost={handleOpenPost}
              onToggleLike={toggleLike}
              onOpenImageViewer={openImageViewer}
              onOpenCommunity={handleOpenCommunity}
              onOpenUser={handleOpenProfile}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.white85}
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
                <TouchableOpacity
                  style={styles.sideMenuButton}
                  disabled={setUserContentBlock.isPending}
                  onPress={() => {
                    void handleToggleCommunityBlock();
                  }}
                >
                  <Text style={typography.body_white85}>
                    {community.isBlockedByMe
                      ? "Разблокировать сообщество"
                      : "Заблокировать сообщество"}
                  </Text>
                </TouchableOpacity>
                {canReportCommunity ? (
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
          title="Жалоба на сообщество"
          isSubmitting={createReport.isPending}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={(description) => {
            void handleSubmitCommunityReport(description);
          }}
        />
        <StatusBar style="auto" />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  centeredInList: {
    alignItems: "center",
    marginTop: 24,
  },
  communityAvatar: {
    borderRadius: 44,
    height: 88,
    width: 88,
  },
  communityCard: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 24,
    gap: 8,
    marginTop: 16,
    padding: 16,
  },
  communityDescription: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  communityNameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  goBackWrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  headerRow: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerWrap: {
    marginTop: 14,
  },
  listContent: {
    paddingBottom: 80,
  },
  metaRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 6,
  },
  postsTitle: {
    color: COLORS.white85,
    fontFamily: "SFProText-Semibold",
    fontSize: 20,
    lineHeight: 28,
    marginTop: 16,
  },
  settingsButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
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
  subscribeButton: {
    alignItems: "center",
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 36,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  subscribeButtonText: {
    color: COLORS.white100,
    fontSize: 14,
    lineHeight: 20,
  },
  unsubscribeButton: {
    backgroundColor: COLORS.postsCardBackground,
    borderColor: COLORS.white25,
    borderWidth: 1,
  },
});
