import { Ionicons } from "@expo/vector-icons";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppScreen } from "../../components/layout/AppScreen";
import ScreenName from "../../constants/ScreenName";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { RootStackParamList } from "../../navigation/RootStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type FeedNavigationProp = NativeStackNavigationProp<
  FeedStackParamList,
  "Notifications"
>;
type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type NavigationProp = CompositeNavigationProp<
  FeedNavigationProp,
  RootNavigationProp
>;
const MAX_INFINITE_PAGES = 10;

type NotificationItem = {
  id: string;
  type:
    | "POST_LIKED"
    | "POST_COMMENTED"
    | "COMMENT_REPLIED"
    | "USER_FOLLOWED"
    | "COMMUNITY_BLACKLISTED"
    | "COMMUNITY_UNBLACKLISTED"
    | "ADMIN_NEW_REPORT"
    | "ADMIN_NEW_COMMUNITY_VERIFICATION_REQUEST";
  createdAt: Date;
  readAt: Date | null;
  details: unknown;
  postId: string | null;
  actor: {
    id: string;
    nickname: string;
    name: string;
  };
  post: {
    id: string;
    title: string;
  } | null;
  community: {
    id: string;
    name: string;
  } | null;
};

const getNotificationDetails = (details: NotificationItem["details"]) => {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }

  const raw = details as {
    duration?: unknown;
    durationLabel?: unknown;
    expiresAt?: unknown;
    reason?: unknown;
  };

  return {
    duration:
      raw.duration === "PERMANENT" ||
      raw.duration === "DAY" ||
      raw.duration === "WEEK" ||
      raw.duration === "MONTH"
        ? raw.duration
        : undefined,
    durationLabel:
      typeof raw.durationLabel === "string" ? raw.durationLabel : undefined,
    expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : undefined,
    reason:
      raw.reason === "MANUAL" || raw.reason === "EXPIRED"
        ? raw.reason
        : undefined,
  };
};

const getNotificationText = (notification: NotificationItem) => {
  if (notification.type === "POST_LIKED") {
    return `@${notification.actor.nickname} поставил(а) лайк вашему посту`;
  }

  if (notification.type === "POST_COMMENTED") {
    return `@${notification.actor.nickname} прокомментировал(а) ваш пост`;
  }

  if (notification.type === "USER_FOLLOWED") {
    return `@${notification.actor.nickname} подписался(ась) на вас`;
  }

  if (notification.type === "COMMUNITY_BLACKLISTED") {
    const details = getNotificationDetails(notification.details);
    const durationLabel = details.durationLabel;

    return notification.community
      ? `@${notification.actor.nickname} добавил(а) вас в ЧС сообщества ${notification.community.name}${durationLabel ? ` на ${durationLabel}` : ""}`
      : `@${notification.actor.nickname} добавил(а) вас в черный список сообщества${durationLabel ? ` на ${durationLabel}` : ""}`;
  }

  if (notification.type === "COMMUNITY_UNBLACKLISTED") {
    const details = getNotificationDetails(notification.details);
    const reason = details.reason;

    return notification.community
      ? reason === "EXPIRED"
        ? `Блокировка в сообществе ${notification.community.name} завершилась`
        : `@${notification.actor.nickname} снял(а) блокировку в сообществе ${notification.community.name}`
      : reason === "EXPIRED"
        ? "Срок блокировки в сообществе истек"
        : `@${notification.actor.nickname} снял(а) блокировку в сообществе`;
  }

  if (notification.type === "ADMIN_NEW_REPORT") {
    return `@${notification.actor.nickname} отправил(а) новую жалобу`;
  }

  if (notification.type === "ADMIN_NEW_COMMUNITY_VERIFICATION_REQUEST") {
    return notification.community
      ? `@${notification.actor.nickname} отправил(а) заявку на верификацию: ${notification.community.name}`
      : `@${notification.actor.nickname} отправил(а) заявку на верификацию сообщества`;
  }

  return `@${notification.actor.nickname} ответил(а) на ваш комментарий`;
};

export const NotificationsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const utils = trpc.useUtils();
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = trpc.getMyNotifications.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
    },
  );

  const markAllNotificationsRead = trpc.markAllNotificationsRead.useMutation();

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.notifications) ?? [],
    [data],
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.readAt),
    [notifications],
  );
  const readNotifications = useMemo(
    () => notifications.filter((item) => !!item.readAt),
    [notifications],
  );

  const sections = useMemo(() => {
    const result: Array<{ title: string; data: NotificationItem[] }> = [];

    if (unreadNotifications.length > 0) {
      result.push({ title: "Непрочитанные", data: unreadNotifications });
    }

    if (readNotifications.length > 0) {
      result.push({ title: "Прочитанные", data: readNotifications });
    }

    return result;
  }, [unreadNotifications, readNotifications]);

  const markAllRead = useCallback(async () => {
    if (
      unreadNotifications.length === 0 ||
      markAllNotificationsRead.isPending
    ) {
      return;
    }

    await markAllNotificationsRead.mutateAsync({});
    await utils.getUnreadNotificationsCount.invalidate();
  }, [unreadNotifications.length, markAllNotificationsRead, utils]);

  const handleOpenNotification = async (notification: NotificationItem) => {
    await markAllRead();

    if (notification.type === "USER_FOLLOWED") {
      navigation.navigate("Profile", { userId: notification.actor.id });
      return;
    }

    if (notification.type === "COMMUNITY_BLACKLISTED") {
      return;
    }

    if (notification.type === "COMMUNITY_UNBLACKLISTED") {
      if (notification.community?.id) {
        navigation.navigate("Community", { id: notification.community.id });
      }
      return;
    }

    if (notification.type === "ADMIN_NEW_REPORT") {
      navigation.navigate(ScreenName.AdminStack, {
        screen: ScreenName.AdminReports,
      });
      return;
    }

    if (notification.type === "ADMIN_NEW_COMMUNITY_VERIFICATION_REQUEST") {
      navigation.navigate(ScreenName.AdminStack, {
        screen: ScreenName.AdminCommunityVerificationRequests,
      });
      return;
    }

    if (notification.postId) {
      navigation.navigate("Post", { id: notification.postId });
    }
  };

  const handleGoBack = async () => {
    await markAllRead();
    navigation.goBack();
  };

  const handleRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        utils.getUnreadNotificationsCount.invalidate(),
      ]);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refetch, utils]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.white100} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          Ошибка загрузки уведомлений: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <AppScreen contentStyle={styles.safeArea} withBottomEdgeBlur>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={20} color={COLORS.white85} />
        </TouchableOpacity>
        <Text style={typography.h4_white_85}>Уведомления</Text>
        <View style={styles.headerSpacer} />
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={typography.body_white85}>Пока уведомлений нет</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isPullRefreshing}
          onRefresh={handleRefresh}
          onEndReached={() => {
            if (!hasNextPage || isFetchingNextPage) {
              return;
            }
            fetchNextPage();
          }}
          onEndReachedThreshold={0.2}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleOpenNotification(item)}
              style={[
                styles.card,
                !item.readAt ? styles.cardUnread : styles.cardRead,
              ]}
            >
              <Text style={typography.body_white85}>
                {getNotificationText(item)}
              </Text>
              {item.post ? (
                <Text style={typography.caption_white85} numberOfLines={1}>
                  Пост: {item.post.title}
                </Text>
              ) : item.type === "COMMUNITY_BLACKLISTED" ? (
                <Text style={typography.caption_white85} numberOfLines={1}>
                  Ограничение уже применено
                </Text>
              ) : item.type === "COMMUNITY_UNBLACKLISTED" ? (
                <Text style={typography.caption_white85} numberOfLines={1}>
                  Нажмите, чтобы открыть сообщество
                </Text>
              ) : item.type === "ADMIN_NEW_REPORT" ? (
                <Text style={typography.caption_white85} numberOfLines={1}>
                  Нажмите, чтобы открыть жалобы
                </Text>
              ) : item.type === "ADMIN_NEW_COMMUNITY_VERIFICATION_REQUEST" ? (
                <Text style={typography.caption_white85} numberOfLines={1}>
                  Нажмите, чтобы открыть заявки на верификацию
                </Text>
              ) : (
                <Text style={typography.caption_white85} numberOfLines={1}>
                  Нажмите, чтобы открыть профиль
                </Text>
              )}
              <Text style={typography.additionalInfo_white25}>
                {format(new Date(item.createdAt), "dd.MM.yyyy HH:mm")}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={COLORS.white100} />
              </View>
            ) : null
          }
        />
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    gap: 4,
    marginBottom: 8,
    padding: 14,
  },
  cardRead: {
    backgroundColor: COLORS.postsCardBackground,
  },
  cardUnread: {
    backgroundColor: COLORS.notificationUnreadBackground,
    borderColor: COLORS.notificationUnreadBorder,
    borderWidth: 1,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  footerLoader: {
    paddingVertical: 12,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerSpacer: {
    width: 36,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  listContent: {
    paddingBottom: 80,
  },
  safeArea: {
    flex: 1,
    paddingBottom: 20,
    paddingHorizontal: 14,
    paddingTop: 20,
  },
  sectionTitle: {
    color: COLORS.white85,
    fontFamily: "SFProText-Semibold",
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 8,
    marginTop: 12,
  },
});
