/* eslint-disable @typescript-eslint/no-require-imports */
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
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
import { getAvatarSource } from "../../lib/avatar";
import { useMe } from "../../lib/ctx";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { AdminStackParamList } from "../../navigation/AdminStackParamList";
import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { ProfileStackParamList } from "../../navigation/ProfileStackParamList";
import type { SearchStackParamList } from "../../navigation/SearchStackParamList";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const MAX_INFINITE_PAGES = 10;

type UserConnectionsRouteParams = {
  [ScreenName.UserConnections]: {
    userId: string;
    type: "followers" | "following";
  };
};

type UserConnectionsRouteProp = RouteProp<
  UserConnectionsRouteParams,
  ScreenName.UserConnections
>;

type UserConnectionsNavProp = NativeStackNavigationProp<
  FeedStackParamList &
    SearchStackParamList &
    ProfileStackParamList &
    AdminStackParamList,
  ScreenName.UserConnections
>;

export const UserConnectionsScreen = () => {
  const route = useRoute<UserConnectionsRouteProp>();
  const navigation = useNavigation<UserConnectionsNavProp>();
  const utils = trpc.useUtils();
  const me = useMe();

  const { userId, type } = route.params;

  const profileQuery = trpc.getUserProfile.useQuery({ userId });
  const followsQueryKey = {
    userId,
    type,
    limit: 20,
  } as const;

  const followsQuery = trpc.getUserFollows.useInfiniteQuery(followsQueryKey, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    maxPages: MAX_INFINITE_PAGES,
  });

  const setUserFollow = trpc.setUserFollow.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getUserFollows.invalidate(followsQueryKey),
        utils.getUserProfile.invalidate({ userId }),
        me?.id
          ? utils.getUserProfile.invalidate({ userId: me.id })
          : Promise.resolve(),
      ]);
    },
  });

  const users = useMemo(
    () => followsQuery.data?.pages.flatMap((page) => page.users) ?? [],
    [followsQuery.data],
  );

  const title = type === "followers" ? "Подписчики" : "Подписки";

  const onRefresh = async () => {
    await Promise.all([followsQuery.refetch(), profileQuery.refetch()]);
  };

  const handleOpenProfile = (targetUserId: string) => {
    navigation.push(ScreenName.Profile, { userId: targetUserId });
  };

  if (followsQuery.isLoading && !followsQuery.data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.white85} size="large" />
      </View>
    );
  }

  if (followsQuery.error) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          {followsQuery.error.message}
        </Text>
      </View>
    );
  }

  return (
    <AppScreen contentStyle={styles.container}>
      <View style={styles.headerWrap}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.goBackWrapper}
        >
          <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
          <Text style={typography.body_white85}>Назад</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleBlock}>
        <Text style={typography.h3_white85}>{title}</Text>
        <Text style={typography.caption_white85}>
          @{profileQuery.data?.profile.nickname ?? "user"}
        </Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.userRow}>
            <TouchableOpacity
              style={styles.userMain}
              onPress={() => handleOpenProfile(item.id)}
            >
              <Image
                source={getAvatarSource(item.avatar, "small")}
                style={styles.avatar}
              />

              <View style={styles.userTextWrap}>
                <Text style={typography.body_white85}>
                  {item.name || item.nickname}
                </Text>
                <Text style={typography.caption_white85}>@{item.nickname}</Text>
              </View>
            </TouchableOpacity>

            {me?.id && me.id !== item.id ? (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  item.isFollowedByMe ? styles.unfollowButton : null,
                ]}
                disabled={setUserFollow.isPending}
                onPress={() => {
                  setUserFollow.mutate({
                    userId: item.id,
                    isFollowing: !item.isFollowedByMe,
                  });
                }}
              >
                <Text style={styles.followButtonText}>
                  {item.isFollowedByMe ? "Отписаться" : "Подписаться"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={typography.body_white85}>Список пока пуст</Text>
          </View>
        }
        ListFooterComponent={
          followsQuery.isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={COLORS.white85} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={followsQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={COLORS.white85}
          />
        }
        onEndReached={() => {
          if (!followsQuery.hasNextPage || followsQuery.isFetchingNextPage) {
            return;
          }

          followsQuery.fetchNextPage();
        }}
        onEndReachedThreshold={0.2}
      />

      <StatusBar style="auto" />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 32,
  },
  followButton: {
    alignItems: "center",
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 108,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  followButtonText: {
    color: COLORS.white100,
    fontSize: 13,
    lineHeight: 18,
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
  headerWrap: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  titleBlock: {
    gap: 4,
    marginBottom: 12,
    marginTop: 16,
  },
  unfollowButton: {
    backgroundColor: COLORS.postsCardBackground,
    borderColor: COLORS.white25,
    borderWidth: 1,
  },
  userMain: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 10,
  },
  userRow: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    padding: 12,
  },
  userTextWrap: {
    flexShrink: 1,
    gap: 2,
  },
});
