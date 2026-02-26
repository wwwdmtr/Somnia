/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<
  FeedStackParamList,
  "Notifications"
>;

type NotificationItem = {
  id: string;
  type: "POST_LIKED" | "POST_COMMENTED" | "COMMENT_REPLIED";
  createdAt: Date;
  readAt: Date | null;
  postId: string;
  actor: {
    id: string;
    nickname: string;
    name: string;
  };
  post: {
    id: string;
    title: string;
  };
};

const getNotificationText = (notification: NotificationItem) => {
  if (notification.type === "POST_LIKED") {
    return `@${notification.actor.nickname} поставил(а) лайк вашему посту`;
  }

  if (notification.type === "POST_COMMENTED") {
    return `@${notification.actor.nickname} прокомментировал(а) ваш пост`;
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

  const handleOpenPost = async (postId: string) => {
    await markAllRead();
    navigation.navigate("Post", { id: postId });
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
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.background}
    >
      <SafeAreaView style={styles.safeArea}>
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
                onPress={() => handleOpenPost(item.postId)}
                style={[
                  styles.card,
                  !item.readAt ? styles.cardUnread : styles.cardRead,
                ]}
              >
                <Text style={typography.body_white85}>
                  {getNotificationText(item)}
                </Text>
                <Text style={typography.caption_white85} numberOfLines={1}>
                  Пост: {item.post.title}
                </Text>
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
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
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
