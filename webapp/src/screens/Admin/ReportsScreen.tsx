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
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppScreen } from "../../components/layout/AppScreen";
import ScreenName from "../../constants/ScreenName";
import { useMe } from "../../lib/ctx";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { AdminStackParamList } from "../../navigation/AdminStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<
  AdminStackParamList,
  ScreenName.AdminReports
>;

const MAX_INFINITE_PAGES = 10;
const LIMIT = 10;
const ACTION_DANGER_BORDER = "rgba(255,99,99,0.55)";

const REPORT_STATUS_LABELS: Record<
  "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED",
  string
> = {
  OPEN: "Открыта",
  IN_REVIEW: "В работе",
  RESOLVED: "Решена",
  REJECTED: "Отклонена",
};

const REPORT_STATUS_COLORS: Record<
  "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED",
  string
> = {
  OPEN: "rgba(255,255,255,0.82)",
  IN_REVIEW: "#F6C85F",
  RESOLVED: "#58D68D",
  REJECTED: "#FF6B6B",
};

export const ReportsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const me = useMe();
  const canAccessReports = isUserAdmin(me);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);

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
  } = trpc.getAdminReports.useInfiniteQuery(
    { limit: LIMIT },
    {
      enabled: canAccessReports,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      maxPages: MAX_INFINITE_PAGES,
      staleTime: 10_000,
    },
  );

  const setAdminReportStatus = trpc.setAdminReportStatus.useMutation({
    onSuccess: async () => {
      await utils.getAdminReports.invalidate();
    },
  });

  const reports = useMemo(() => {
    return (data?.pages ?? []).flatMap((page) => page.reports);
  }, [data]);

  const onRefresh = async () => {
    if (!canAccessReports) {
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
    if (!canAccessReports || !hasNextPage || isFetchingNextPage) {
      return;
    }

    fetchNextPage();
  };

  const handleSetStatus = (
    reportId: string,
    status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED",
  ) => {
    setPendingReportId(reportId);
    setAdminReportStatus.mutate(
      {
        reportId,
        status,
      },
      {
        onSettled: () => {
          setPendingReportId(null);
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

  if (!canAccessReports) {
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
      <Text style={typography.body_white85}>Жалобы</Text>
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

    if (!hasNextPage && reports.length > 0) {
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
      <Text style={typography.body_white85}>Жалоб пока нет</Text>
    </View>
  );

  const renderStatusActions = (
    report: (typeof reports)[number],
    isPending: boolean,
  ) => {
    if (report.status === "OPEN") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isPending}
            onPress={() => handleSetStatus(report.id, "IN_REVIEW")}
          >
            <Text style={typography.caption_white85}>В работу</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionDanger]}
            disabled={isPending}
            onPress={() => handleSetStatus(report.id, "REJECTED")}
          >
            <Text style={typography.caption_white85}>Отклонить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isPending}
            onPress={() => handleSetStatus(report.id, "RESOLVED")}
          >
            <Text style={typography.caption_white85}>Решить</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (report.status === "IN_REVIEW") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isPending}
            onPress={() => handleSetStatus(report.id, "RESOLVED")}
          >
            <Text style={typography.caption_white85}>Решить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionDanger]}
            disabled={isPending}
            onPress={() => handleSetStatus(report.id, "REJECTED")}
          >
            <Text style={typography.caption_white85}>Отклонить</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={isPending}
            onPress={() => handleSetStatus(report.id, "OPEN")}
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
          onPress={() => handleSetStatus(report.id, "OPEN")}
        >
          <Text style={typography.caption_white85}>Открыть заново</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item: report }: { item: (typeof reports)[number] }) => {
    const isPending =
      pendingReportId === report.id && setAdminReportStatus.isPending;

    const targetLabel =
      report.targetType === "POST"
        ? report.post
          ? `Пост: ${report.post.title}`
          : "Пост удален"
        : report.targetUser
          ? `Пользователь: @${report.targetUser.nickname}`
          : "Пользователь удален";

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <Text style={typography.additionalInfo_white25}>
            {format(new Date(report.createdAt), "dd.MM.yyyy HH:mm")}
          </Text>
          <Text
            style={[
              typography.caption_white85,
              { color: REPORT_STATUS_COLORS[report.status] },
            ]}
          >
            {REPORT_STATUS_LABELS[report.status]}
          </Text>
        </View>

        <Text style={typography.body_white85}>
          От @{report.reporter.nickname}
        </Text>
        <Text style={typography.body_white85}>{targetLabel}</Text>
        <Text style={typography.body_white100}>{report.description}</Text>

        <View style={styles.navigationRow}>
          {report.post?.id ? (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                navigation.navigate(ScreenName.Post, { id: report.post!.id })
              }
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={COLORS.white85}
              />
              <Text style={typography.caption_white85}>К посту</Text>
            </TouchableOpacity>
          ) : null}

          {report.targetUser?.id ? (
            <TouchableOpacity
              style={styles.navButton}
              onPress={() =>
                navigation.navigate(ScreenName.Profile, {
                  userId: report.targetUser!.id,
                })
              }
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={COLORS.white85}
              />
              <Text style={typography.caption_white85}>К профилю</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {renderStatusActions(report, isPending)}
      </View>
    );
  };

  return (
    <AppScreen contentStyle={styles.safeArea}>
      <FlatList
        data={reports}
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
    </AppScreen>
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
