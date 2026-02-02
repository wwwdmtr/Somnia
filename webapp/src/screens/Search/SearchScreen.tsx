/* eslint-disable react-native/no-unused-styles */
/* eslint-disable react-native/no-color-literals */
/* eslint-disable @typescript-eslint/no-require-imports */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { zGetRatedPostsTrpcInput } from "@somnia/server/src/router/getRatedPosts/input";
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { useFormik } from "formik";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
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

import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { SearchStackParamList } from "../../navigation/SearchStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<SearchStackParamList, "Search">;
type Period = "day" | "week" | "month" | "all";

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

type LikeMutationContext = {
  previousData: PostsInfiniteData | undefined;
};

export const SearchScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const utils = trpc.useUtils();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all");
  const [showPeriodModal, setShowPeriodModal] = useState(false);

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

    placeholderData: (prev) => prev,
  });

  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.posts) ?? [],
    [query.data],
  );

  const isInitialLoading = query.isLoading && !query.data;
  const isUpdating =
    query.isFetching && !query.isFetchingNextPage && !!query.data;

  const setPostLike = trpc.setPostLike.useMutation({
    onMutate: async (variables: { postId: string; isLikedByMe: boolean }) => {
      await utils.getRatedPosts.cancel(queryKey);

      const previousData = utils.getRatedPosts.getInfiniteData(queryKey);

      utils.getRatedPosts.setInfiniteData(queryKey, (old) => {
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

      return { previousData } satisfies LikeMutationContext;
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previousData) {
        utils.getRatedPosts.setInfiniteData(queryKey, ctx.previousData);
      }
    },

    onSuccess: (data) => {
      utils.getRatedPosts.setInfiniteData(queryKey, (old) => {
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
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await query.refetch();
    setRefreshing(false);
  };

  const handleOpenPost = (id: string) => {
    navigation.navigate("Post", { id });
  };

  const toggleLike = (postId: string, currentLikeState: boolean) => {
    setPostLike.mutate({
      postId,
      isLikedByMe: !currentLikeState,
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
  }) => (
    <View style={styles.card}>
      {!isSearchMode && index < 3 && (
        <View
          style={[
            styles.badge,
            styles[`badge${index + 1}` as "badge1" | "badge2" | "badge3"],
          ]}
        >
          <Text style={typography.caption_white85}>#{index + 1}</Text>
        </View>
      )}

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
      </SafeAreaView>

      {!isSearchMode && renderPeriodModal()}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: { flex: 1 },

  action: { flexDirection: "row", gap: 7 },
  action_img: { height: 24, width: 24 },

  actions: {
    flexDirection: "row",
    height: 22,
    justifyContent: "space-between",
    marginTop: 24,
    width: 277,
  },

  badge: {
    alignItems: "center",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    top: 20,
    width: 40,
    zIndex: 1,
  },
  badge1: { backgroundColor: "#FFD700" },
  badge2: { backgroundColor: "#C0C0C0" },
  badge3: { backgroundColor: "#CD7F32" },

  card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    marginBottom: 8,
    padding: 20,
    position: "relative",
  },

  cardImage: { height: 48, width: 48 },

  centered: { alignItems: "center", flex: 1, justifyContent: "center" },

  dream_info: { gap: 12 },

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

  read_more: { marginTop: 8 },

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
