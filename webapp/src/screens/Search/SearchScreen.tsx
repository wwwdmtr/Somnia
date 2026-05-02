/* eslint-disable react-native/no-unused-styles */
/* eslint-disable react-native/no-color-literals */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { zGetRatedPostsTrpcInput } from "@somnia/shared/src/router/getRatedPosts/input";
import { StatusBar } from "expo-status-bar";
import { useFormik } from "formik";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { AppScreen } from "../../components/layout/AppScreen";
import { PostCard } from "../../components/post/PostCard";
import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import { getAvatarSource } from "../../lib/avatar";
import {
  applyOptimisticLikeToPosts,
  applyServerLikeToPosts,
  usePostLikeMutation,
} from "../../lib/postLikeMutation";
import { trpc } from "../../lib/trpc";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS, typography } from "../../theme/typography";

import type { SearchStackParamList } from "../../navigation/SearchStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<SearchStackParamList, "Search">;
type Period = "day" | "week" | "month" | "all";
type SearchTarget = "posts" | "users" | "communities";

const MAX_INFINITE_PAGES = 10;

const PERIOD_LABELS: Record<Period, string> = {
  day: "За день",
  week: "За неделю",
  month: "За месяц",
  all: "За всё время",
};

const SEARCH_TARGET_LABELS: Record<SearchTarget, string> = {
  posts: "Посты",
  users: "Пользователи",
  communities: "Сообщества",
};
const SEARCH_TARGETS: SearchTarget[] = ["posts", "users", "communities"];

const SEARCH_PLACEHOLDERS: Record<SearchTarget, string> = {
  posts: "Поиск ...",
  users: "Поиск ...",
  communities: "Поиск ...",
};

const zSearchForm = zGetRatedPostsTrpcInput.pick({ search: true }).extend({
  search: zGetRatedPostsTrpcInput.shape.search.optional().default(""),
});

type SearchFormValues = { search: string };

type PostsInfiniteData = NonNullable<
  ReturnType<
    ReturnType<typeof trpc.useUtils>["getRatedPosts"]["getInfiniteData"]
  >
>;

export const SearchScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const utils = trpc.useUtils();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all");
  const [selectedSearchTarget, setSelectedSearchTarget] =
    useState<SearchTarget>("posts");
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
  }>({
    isOpen: false,
    images: [],
    index: 0,
  });

  const formik = useFormik<SearchFormValues>({
    initialValues: { search: "" },
    validationSchema: toFormikValidationSchema(zSearchForm),
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => {},
  });

  const debouncedSearch = useDebouncedValue(formik.values.search, 550);
  const search = debouncedSearch.trim();
  const isSearchMode = search.length > 0;

  const isPostsTarget = selectedSearchTarget === "posts";
  const isUsersTarget = selectedSearchTarget === "users";
  const isCommunitiesTarget = selectedSearchTarget === "communities";

  const queryKey = useMemo(
    () => ({
      limit: 15,
      period: selectedPeriod,
      search: isSearchMode ? search : undefined,
    }),
    [selectedPeriod, isSearchMode, search],
  );

  const postsQuery = trpc.getRatedPosts.useInfiniteQuery(queryKey, {
    enabled: isPostsTarget,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: MAX_INFINITE_PAGES,
    placeholderData: (prev) => prev,
  });

  const usersQuery = trpc.searchUsers.useQuery(
    {
      search,
      limit: 30,
    },
    {
      enabled: isUsersTarget && isSearchMode,
    },
  );

  const communitiesQuery = trpc.searchCommunities.useQuery(
    {
      search,
      limit: 30,
    },
    {
      enabled: isCommunitiesTarget && isSearchMode,
    },
  );

  const posts = useMemo(
    () => postsQuery.data?.pages.flatMap((page) => page.posts) ?? [],
    [postsQuery.data],
  );
  const users = usersQuery.data?.users ?? [];
  const communities = communitiesQuery.data?.communities ?? [];

  const isInitialLoading = isPostsTarget
    ? postsQuery.isLoading && !postsQuery.data
    : false;

  const isUpdating = isPostsTarget
    ? postsQuery.isFetching &&
      !postsQuery.isFetchingNextPage &&
      !!postsQuery.data
    : isUsersTarget
      ? usersQuery.isFetching && !!usersQuery.data
      : communitiesQuery.isFetching && !!communitiesQuery.data;

  const activeError = isPostsTarget
    ? postsQuery.error
    : isUsersTarget
      ? usersQuery.error
      : communitiesQuery.error;

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
    cancel: () => utils.getRatedPosts.cancel(queryKey),
    getData: () => utils.getRatedPosts.getInfiniteData(queryKey),
    setData: (updater) =>
      utils.getRatedPosts.setInfiniteData(queryKey, updater),
  });

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      if (isPostsTarget) {
        await postsQuery.refetch();
        return;
      }

      if (isUsersTarget) {
        await usersQuery.refetch();
        return;
      }

      await communitiesQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenPost = (id: string) => {
    navigation.navigate("Post", { id });
  };

  const handleOpenCommunity = (id: string) => {
    navigation.navigate("Community", { id });
  };

  const handleOpenUser = (userId: string) => {
    navigation.navigate("Profile", { userId });
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

  const handlePeriodSelect = (period: Period) => {
    setSelectedPeriod(period);
    setShowPeriodModal(false);
  };

  const handleSearchTargetSelect = (target: SearchTarget) => {
    setSelectedSearchTarget(target);
  };

  const renderPeriodModal = () => (
    <Modal
      visible={showPeriodModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPeriodModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPeriodModal(false)}
      >
        <View style={styles.modalContent}>
          {(["day", "week", "month", "all"] as Period[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.modalOption,
                selectedPeriod === period && styles.modalOptionActive,
              ]}
              onPress={() => handlePeriodSelect(period)}
            >
              <Text
                style={
                  selectedPeriod === period
                    ? styles.modalOptionTextActive
                    : typography.body_white85
                }
              >
                {PERIOD_LABELS[period]}
              </Text>
              {selectedPeriod === period ? (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={COLORS.brandBlueLight}
                />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderPostItem = ({
    item: post,
    index,
  }: {
    item: (typeof posts)[number];
    index: number;
  }) => {
    const badgeColor =
      index === 0 ? COLORS.gold : index === 1 ? COLORS.silver : COLORS.bronze;

    return (
      <PostCard
        post={post}
        badgeColor={badgeColor}
        badgeLabel={!isSearchMode && index < 3 ? `#${index + 1}` : undefined}
        onOpenPost={handleOpenPost}
        onOpenCommunity={handleOpenCommunity}
        onOpenUser={handleOpenUser}
        onToggleLike={toggleLike}
        onOpenImageViewer={openImageViewer}
      />
    );
  };

  const renderUserItem = ({ item }: { item: (typeof users)[number] }) => {
    return (
      <TouchableOpacity
        style={styles.entityRow}
        onPress={() => handleOpenUser(item.id)}
      >
        <Image
          source={getAvatarSource(item.avatar, "small")}
          style={styles.entityAvatar}
        />
        <View style={styles.entityTextWrap}>
          <Text style={typography.body_white85}>
            {item.name || item.nickname}
          </Text>
          <Text style={typography.caption_white85}>@{item.nickname}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCommunityItem = ({
    item,
  }: {
    item: (typeof communities)[number];
  }) => {
    return (
      <TouchableOpacity
        style={styles.entityRow}
        onPress={() => handleOpenCommunity(item.id)}
      >
        <Image
          source={getAvatarSource(item.avatar, "small")}
          style={styles.entityAvatar}
        />
        <View style={styles.entityTextWrap}>
          <Text style={typography.body_white85}>{item.name}</Text>
          <Text style={typography.caption_white85} numberOfLines={1}>
            {item.description || "Сообщество"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={typography.body_white85}>
        {isSearchMode
          ? "Ничего не найдено"
          : isPostsTarget
            ? "Нет популярных постов за выбранный период"
            : isUsersTarget
              ? "Введите имя или @ник пользователя"
              : "Введите название сообщества"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isPostsTarget || !postsQuery.isFetchingNextPage) {
      return null;
    }

    return (
      <View style={styles.footerLoader}>
        <Text style={typography.caption_white85}>Загрузка...</Text>
      </View>
    );
  };

  const headerEl = (
    <View style={styles.headerContainer}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.activeIcon} />
        <TextInput
          value={formik.values.search}
          onChangeText={(t) => formik.setFieldValue("search", t)}
          placeholder={SEARCH_PLACEHOLDERS[selectedSearchTarget]}
          placeholderTextColor={COLORS.white25}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {formik.values.search.length > 0 ? (
          <TouchableOpacity
            onPress={() => formik.setFieldValue("search", "")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.mutedIcon} />
          </TouchableOpacity>
        ) : null}
      </View>

      {formik.errors.search ? (
        <Text style={styles.searchError}>{String(formik.errors.search)}</Text>
      ) : null}

      <View style={styles.searchTabsRow}>
        {SEARCH_TARGETS.map((target) => {
          const isActive = selectedSearchTarget === target;

          return (
            <TouchableOpacity
              key={target}
              style={styles.searchTab}
              onPress={() => handleSearchTargetSelect(target)}
            >
              <Text
                style={
                  isActive ? styles.searchTabTextActive : styles.searchTabText
                }
              >
                {SEARCH_TARGET_LABELS[target]}
              </Text>
              <View
                style={[
                  styles.searchTabIndicator,
                  isActive && styles.searchTabIndicatorActive,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {isSearchMode ? (
        <View style={styles.header}>
          <Text style={typography.h3_white85}>
            Результаты: {SEARCH_TARGET_LABELS[selectedSearchTarget]}
          </Text>
        </View>
      ) : isPostsTarget ? (
        <View style={styles.header}>
          <Ionicons name="flame" size={24} color={COLORS.unreadDot} />
          <Text style={typography.h3_white85}>Популярные посты</Text>
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={typography.h3_white85}>
            {isUsersTarget ? "Ищите пользователей" : "Ищите сообщества"}
          </Text>
        </View>
      )}

      {isPostsTarget && !isSearchMode ? (
        <TouchableOpacity
          style={styles.periodSelector}
          onPress={() => setShowPeriodModal(true)}
        >
          <Text style={typography.body_white85}>
            {PERIOD_LABELS[selectedPeriod]}
          </Text>
          <Ionicons name="chevron-down" size={20} color={COLORS.white85} />
        </TouchableOpacity>
      ) : null}

      {isUpdating ? (
        <View style={styles.updatingRow}>
          <ActivityIndicator size="small" color={COLORS.mutedIcon} />
        </View>
      ) : null}
    </View>
  );

  if (activeError) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          Ошибка: {activeError.message ?? "Неизвестная ошибка"}
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  const commonProps = {
    ListEmptyComponent: renderEmpty,
    ListFooterComponent: renderFooter,
    ListHeaderComponent: headerEl,
    contentContainerStyle: styles.listContent,
    keyboardShouldPersistTaps: "handled" as const,
    refreshControl: (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={COLORS.white100}
      />
    ),
    showsVerticalScrollIndicator: false,
  };

  return (
    <AppScreen contentStyle={styles.safeArea}>
      {isInitialLoading ? (
        <View style={styles.centered}>
          <Text style={typography.body_white85}>Загрузка...</Text>
          <StatusBar style="auto" />
        </View>
      ) : isPostsTarget ? (
        <FlatList
          {...commonProps}
          data={posts}
          key="posts"
          keyExtractor={(item) => item.id}
          renderItem={renderPostItem}
          onEndReached={() => {
            if (!postsQuery.hasNextPage || postsQuery.isFetchingNextPage) {
              return;
            }

            postsQuery.fetchNextPage();
          }}
          onEndReachedThreshold={0.15}
        />
      ) : isUsersTarget ? (
        <FlatList
          {...commonProps}
          data={users}
          key="users"
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
        />
      ) : (
        <FlatList
          {...commonProps}
          data={communities}
          key="communities"
          keyExtractor={(item) => item.id}
          renderItem={renderCommunityItem}
        />
      )}

      <PostImageViewerModal
        visible={imageViewerState.isOpen}
        imagePublicIds={imageViewerState.images}
        initialIndex={imageViewerState.index}
        onClose={() =>
          setImageViewerState((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {isPostsTarget && !isSearchMode ? renderPeriodModal() : null}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  centered: { alignItems: "center", flex: 1, justifyContent: "center" },

  emptyContainer: { alignItems: "center", marginTop: 32 },

  entityAvatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },

  entityRow: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
    padding: 12,
  },

  entityTextWrap: {
    flex: 1,
    gap: 2,
  },

  footerLoader: { alignItems: "center", paddingVertical: 20 },

  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },

  headerContainer: { gap: 16, marginBottom: 20 },

  listContent: { padding: 14, paddingBottom: 70 },

  modalContent: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 20,
    marginBottom: "auto",
    marginHorizontal: 20,
    marginTop: "auto",
    padding: 8,
  },

  modalOption: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  modalOptionActive: { backgroundColor: COLORS.notificationUnreadBackground },

  modalOptionTextActive: {
    color: COLORS.linkColor,
    fontSize: 16,
    fontWeight: "400",
  },

  modalOverlay: {
    backgroundColor: COLORS.modalOverlay,
    flex: 1,
    justifyContent: "center",
  },

  periodSelector: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  safeArea: { flex: 1, marginBottom: 20 },

  searchBox: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: "100%",
  },

  searchError: {
    color: COLORS.inputErrorBorderColor,
    fontSize: 13,
    marginTop: 8,
  },

  searchInput: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0,
    color: COLORS.white85,
    flex: 1,
    fontSize: 16,
    margin: 0,
    minWidth: 0,
    ...webInputFocusReset,
    padding: 0,
    width: 0,
  },

  searchTab: {
    alignItems: "center",
    gap: 6,
    paddingBottom: 8,
    paddingHorizontal: 8,
    paddingTop: 2,
  },

  searchTabIndicator: {
    backgroundColor: "transparent",
    borderRadius: 99,
    height: 2,
    width: "100%",
  },

  searchTabIndicatorActive: {
    backgroundColor: COLORS.campusCyan,
  },

  searchTabText: {
    color: COLORS.mutedIcon,
    fontSize: 16,
    fontWeight: "400",
  },

  searchTabTextActive: {
    color: COLORS.white85,
    fontSize: 16,
    fontWeight: "400",
  },

  searchTabsRow: {
    alignItems: "flex-end",
    borderBottomColor: COLORS.surfaceBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    width: "100%",
  },

  updatingRow: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: -6,
  },

  updatingText: {
    alignSelf: "center",
    color: COLORS.mutedIcon,
    fontSize: 13,
    marginTop: -6,
  },
});
