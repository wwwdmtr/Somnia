/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { isUserAdmin } from "@somnia/shared/src/utils/can";
import { format } from "date-fns";
import React, { useMemo, useState } from "react";
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

import ScreenName from "../../constants/ScreenName";
import { useMe } from "../../lib/ctx";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { AdminStackParamList } from "../../navigation/AdminStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<
  AdminStackParamList,
  ScreenName.AdminCommunityVerificationRequests
>;

const MAX_INFINITE_PAGES = 10;
const LIMIT = 10;
const ACTION_DANGER_BORDER = "rgba(255,99,99,0.55)";

const REQUEST_STATUS_LABELS: Record<
  "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED",
  string
> = {
  OPEN: "Открыта",
  IN_REVIEW: "В работе",
  RESOLVED: "Решена",
  REJECTED: "Отклонена",
};

const REQUEST_STATUS_COLORS: Record<
  "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED",
  string
> = {
  OPEN: "rgba(255,255,255,0.82)",
  IN_REVIEW: "#F6C85F",
  RESOLVED: "#58D68D",
  REJECTED: "#FF6B6B",
};

export const CommunityVerificationRequestsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const me = useMe();
  const canAccessRequests = isUserAdmin(me);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const {
    data,
    error,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = trpc.getAdminCommunityVerificationRequests.useInfiniteQuery(
    { limit: LIMIT },
    {
      enabled: canAccessRequests,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      maxPages: MAX_INFINITE_PAGES,
      staleTime: 10_000,
    },
  );

  const setAdminCommunityVerificationRequestStatus =
    trpc.setAdminCommunityVerificationRequestStatus.useMutation({
      onSuccess: async () => {
        await utils.getAdminCommunityVerificationRequests.invalidate();
      },
    });

  const requests = useMemo(() => {
    return (data?.pages ?? []).flatMap((page) => page.requests);
  }, [data]);

  const onRefresh = async () => {
    if (!canAccessRequests) {
      return;
    }

    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const loadMore = () => {
    if (!canAccessRequests || !hasNextPage || isFetchingNextPage) {
      return;
    }

    fetchNextPage();
  };

  const handleSetStatus = (
    requestId: string,
    status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED",
  ) => {
    setPendingRequestId(requestId);
    setAdminCommunityVerificationRequestStatus.mutate(
      {
        requestId,
        status,
      },
      {
        onSettled: () => {
          setPendingRequestId(null);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          Error: {error.message ?? "Unknown error"}
        </Text>
      </View>
    );
  }

  if (!canAccessRequests) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>Недостаточно прав доступа</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.goBackWrapper}
      >
        <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
        <Text style={typography.body_white85}>Назад</Text>
      </TouchableOpacity>
      <Text style={typography.body_white85}>Верификация сообществ</Text>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator />
          <Text style={typography.caption_white85}>Загружаю ещё…</Text>
        </View>
      );
    }

    if (!hasNextPage && requests.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={typography.caption_white85}>Больше нет</Text>
        </View>
      );
    }

    return <View />;
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Text style={typography.body_white85}>Заявок пока нет</Text>
    </View>
  );

  const renderStatusActions = (
    request: (typeof requests)[number],
    isPending: boolean,
  ) => {
    if (request.status === "OPEN") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isPending}
            onPress={() => handleSetStatus(request.id, "IN_REVIEW")}
          >
            <Text style={typography.caption_white85}>В работу</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionDanger]}
            disabled={isPending}
            onPress={() => handleSetStatus(request.id, "REJECTED")}
          >
            <Text style={typography.caption_white85}>Отклонить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isPending}
            onPress={() => handleSetStatus(request.id, "RESOLVED")}
          >
            <Text style={typography.caption_white85}>Одобрить</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (request.status === "IN_REVIEW") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isPending}
            onPress={() => handleSetStatus(request.id, "RESOLVED")}
          >
            <Text style={typography.caption_white85}>Одобрить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionDanger]}
            disabled={isPending}
            onPress={() => handleSetStatus(request.id, "REJECTED")}
          >
            <Text style={typography.caption_white85}>Отклонить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isPending}
            onPress={() => handleSetStatus(request.id, "OPEN")}
          >
            <Text style={typography.caption_white85}>Открыть</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionButton}
          disabled={isPending}
          onPress={() => handleSetStatus(request.id, "OPEN")}
        >
          <Text style={typography.caption_white85}>Открыть заново</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({
    item: request,
  }: {
    item: (typeof requests)[number];
  }) => {
    const isPending =
      pendingRequestId === request.id &&
      setAdminCommunityVerificationRequestStatus.isPending;

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={typography.additionalInfo_white25}>
            {format(new Date(request.createdAt), "dd.MM.yyyy HH:mm")}
          </Text>
          <Text
            style={[
              typography.caption_white85,
              { color: REQUEST_STATUS_COLORS[request.status] },
            ]}
          >
            {REQUEST_STATUS_LABELS[request.status]}
          </Text>
        </View>

        <Text style={typography.body_white85}>
          Сообщество: {request.community.name}
        </Text>
        <Text style={typography.body_white85}>
          От @{request.requester.nickname}
        </Text>
        <Text style={typography.body_white100}>Контакт: {request.contact}</Text>

        <View style={styles.navigationRow}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() =>
              navigation.navigate(ScreenName.Community, {
                id: request.community.id,
              })
            }
          >
            <Ionicons name="people-outline" size={16} color={COLORS.white85} />
            <Text style={typography.caption_white85}>К сообществу</Text>
          </TouchableOpacity>
        </View>

        {renderStatusActions(request, isPending)}
      </View>
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || isRefetching}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          windowSize={7}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          removeClippedSubviews
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 84,
    paddingHorizontal: 12,
  },
  actionDanger: {
    borderColor: ACTION_DANGER_BORDER,
    borderWidth: 1,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  backgroundImage: { flex: 1 },
  card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 28,
    gap: 8,
    marginBottom: 8,
    padding: 16,
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  empty: {
    alignItems: "center",
    marginTop: 40,
  },
  footer: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
  },
  goBackWrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  headerContainer: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  navButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  navigationRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  safeArea: {
    flex: 1,
    marginBottom: 20,
    marginHorizontal: 14,
  },
});
