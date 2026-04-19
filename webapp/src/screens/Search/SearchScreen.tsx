/* eslint-disable react-native/no-unused-styles */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-require-imports */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { zGetRatedPostsTrpcInput } from "@somnia/shared/src/router/getRatedPosts/input";
import { StatusBar } from "expo-status-bar";
import { useFormik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toFormikValidationSchema } from "zod-formik-adapter";

import { PostCard } from "../../components/post/PostCard";
import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import {
  applyOptimisticLikeToPosts,
  applyServerLikeToPosts,
  usePostLikeMutation,
} from "../../lib/postLikeMutation";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { SearchStackParamList } from "../../navigation/SearchStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<SearchStackParamList, "Search">;
type Period = "day" | "week" | "month" | "all";
const MAX_INFINITE_PAGES = 10;

const PERIOD_LABELS: Record<Period, string> = {
  day: "За день",
  week: "За неделю",
  month: "За месяц",
  all: "За всё время",
};

function useDebouncedValue<T>(value: T, delayMs = 1000) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

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

  const queryKey = useMemo(
    () => ({
      limit: 15,
      period: selectedPeriod,
      search: isSearchMode ? search : undefined,
    }),
    [selectedPeriod, isSearchMode, search],
  );

  const query = trpc.getRatedPosts.useInfiniteQuery(queryKey, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: MAX_INFINITE_PAGES,

    placeholderData: (prev) => prev,
  });

  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.posts) ?? [],
    [query.data],
  );

  const isInitialLoading = query.isLoading && !query.data;
  const isUpdating =
    query.isFetching && !query.isFetchingNextPage && !!query.data;

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
    await query.refetch();
    setRefreshing(false);
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

  const headerEl = (
    <View style={styles.headerContainer}>
      {/* Search input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
        <TextInput
          value={formik.values.search}
          onChangeText={(t) => formik.setFieldValue("search", t)}
          placeholder="Поиск по постам..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {!!formik.values.search && (
          <TouchableOpacity
            onPress={() => formik.setFieldValue("search", "")}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color="rgba(255,255,255,0.6)"
            />
          </TouchableOpacity>
        )}
      </View>

      {formik.errors.search ? (
        <Text style={styles.searchError}>{String(formik.errors.search)}</Text>
      ) : null}

      {isSearchMode ? (
        <View style={styles.header}>
          <Text style={typography.h3_white85}>Результаты поиска</Text>
        </View>
      ) : (
        <View style={styles.header}>
          <Ionicons name="flame" size={24} color="#FF6B6B" />
          <Text style={typography.h3_white85}>Популярные посты</Text>
        </View>
      )}

      {!isSearchMode && (
        <TouchableOpacity
          style={styles.periodSelector}
          onPress={() => setShowPeriodModal(true)}
        >
          <Text style={typography.body_white85}>
            {PERIOD_LABELS[selectedPeriod]}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color="rgba(255,255,255,0.85)"
          />
        </TouchableOpacity>
      )}

      {isUpdating ? (
        <View style={styles.updatingRow}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.65)" />
        </View>
      ) : null}
    </View>
  );

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
                styles.periodOption,
                selectedPeriod === period && styles.periodOptionActive,
              ]}
              onPress={() => handlePeriodSelect(period)}
            >
              <Text
                style={
                  selectedPeriod === period
                    ? styles.periodOptionTextActive
                    : typography.body_white85
                }
              >
                {PERIOD_LABELS[period]}
              </Text>
              {selectedPeriod === period && (
                <Ionicons name="checkmark" size={20} color="#FF6B6B" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderItem = ({
    item: post,
    index,
  }: {
    item: (typeof posts)[number];
    index: number;
  }) => {
    const badgeColor =
      index === 0 ? "#FFD700" : index === 1 ? "#C0C0C0" : "#CD7F32";

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

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={typography.body_white85}>
        {isSearchMode
          ? "Ничего не найдено"
          : "Нет популярных постов за выбранный период"}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!query.isFetchingNextPage) {
      return null;
    }
    return (
      <View style={styles.footerLoader}>
        <Text style={typography.caption_white85}>Загрузка...</Text>
      </View>
    );
  };

  if (query.error) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          Ошибка: {query.error.message ?? "Неизвестная ошибка"}
        </Text>
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
        {isInitialLoading ? (
          <View style={styles.centered}>
            <Text style={typography.body_white85}>Загрузка...</Text>
            <StatusBar style="auto" />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={headerEl}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#ffffff"
              />
            }
            onEndReached={() => {
              if (!query.hasNextPage || query.isFetchingNextPage) {
                return;
              }
              query.fetchNextPage();
            }}
            onEndReachedThreshold={0.15}
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
      </SafeAreaView>

      {!isSearchMode && renderPeriodModal()}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: { flex: 1 },

  centered: { alignItems: "center", flex: 1, justifyContent: "center" },

  emptyContainer: { alignItems: "center", marginTop: 32 },

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

  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
  },

  periodOption: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  periodOptionActive: { backgroundColor: "rgba(255, 107, 107, 0.1)" },

  periodOptionTextActive: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "400",
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
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  searchError: { color: "#FF6B6B", fontSize: 13, marginTop: 8 },

  searchInput: {
    color: "rgba(255,255,255,0.85)",
    flex: 1,
    fontSize: 16,
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
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    marginTop: -6,
  },
});
