/* eslint-disable @typescript-eslint/no-require-imports */

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Modal,
  Platform,
  TouchableOpacity,
  Text,
  TextInput,
  View,
  Image,
  ScrollView,
} from "react-native";

import { AvatarUploader } from "../../components/forms/AvatarUploader";
import { UpdatePasswordForm } from "../../components/forms/UpdatePasswordForm";
import { UpdateProfileForm } from "../../components/forms/UpdateProfileForm";
import { AppScreen } from "../../components/layout/AppScreen";
import { AppButton } from "../../components/ui/AppButton";
import ScreenName from "../../constants/ScreenName";
import { SHELL_CONTENT_WIDTH } from "../../constants/layout";
import { trpc } from "../../lib/trpc";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { ProfileStackParamList } from "../../navigation/ProfileStackParamList";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS, typography } from "../../theme/typography";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  ScreenName.UpdateProfile
>;
const MODAL_OVERLAY_BACKGROUND = "rgba(0, 0, 0, 0.45)";
const ERROR_TEXT_COLOR = "rgba(255,154,154,1)";
const BLOCKED_LIST_PAGE_LIMIT = 20;
const MAX_INFINITE_PAGES = 10;

export const UpdateProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const utils = trpc.useUtils();
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedSearch, setBlockedSearch] = useState("");
  const [pendingBlockedUserId, setPendingBlockedUserId] = useState<
    string | null
  >(null);
  const [pendingBlockedCommunityId, setPendingBlockedCommunityId] = useState<
    string | null
  >(null);
  const debouncedBlockedSearch = useDebouncedValue(blockedSearch, 350);
  const blockedSearchTerm = (
    blockedSearch ? debouncedBlockedSearch : ""
  ).trim();

  const blockedUsersQuery = trpc.getMyBlockedUsers.useInfiniteQuery(
    {
      limit: BLOCKED_LIST_PAGE_LIMIT,
      search: blockedSearchTerm || undefined,
    },
    {
      enabled: isBlockedModalOpen,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
      placeholderData: (prev) => prev,
    },
  );
  const blockedCommunitiesQuery = trpc.getMyBlockedCommunities.useInfiniteQuery(
    {
      limit: BLOCKED_LIST_PAGE_LIMIT,
      search: blockedSearchTerm || undefined,
    },
    {
      enabled: isBlockedModalOpen,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
      placeholderData: (prev) => prev,
    },
  );
  const setUserContentBlock = trpc.setUserContentBlock.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getMyBlockedUsers.invalidate(),
        utils.getMyBlockedCommunities.invalidate(),
        utils.getPosts.invalidate(),
        utils.getSubscribedPosts.invalidate(),
        utils.getRatedPosts.invalidate(),
        utils.getUserProfile.invalidate(),
      ]);
    },
  });
  const blockedUsers = useMemo(() => {
    return blockedUsersQuery.data?.pages.flatMap((page) => page.items) ?? [];
  }, [blockedUsersQuery.data]);
  const blockedCommunities = useMemo(() => {
    return (
      blockedCommunitiesQuery.data?.pages.flatMap((page) => page.items) ?? []
    );
  }, [blockedCommunitiesQuery.data]);
  const isBlockedUsersInitialLoading =
    blockedUsersQuery.isLoading && !blockedUsersQuery.data;
  const isBlockedCommunitiesInitialLoading =
    blockedCommunitiesQuery.isLoading && !blockedCommunitiesQuery.data;

  const handleUnblockUser = async (userId: string) => {
    setPendingBlockedUserId(userId);
    try {
      await setUserContentBlock.mutateAsync({
        targetType: "USER",
        targetUserId: userId,
        isBlocked: false,
      });
    } finally {
      setPendingBlockedUserId(null);
    }
  };

  const handleUnblockCommunity = async (communityId: string) => {
    setPendingBlockedCommunityId(communityId);
    try {
      await setUserContentBlock.mutateAsync({
        targetType: "COMMUNITY",
        targetCommunityId: communityId,
        isBlocked: false,
      });
    } finally {
      setPendingBlockedCommunityId(null);
    }
  };

  return (
    <AppScreen contentStyle={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
            <Text style={typography.body_white85}>Назад</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.name_settings_card}>
          <Text style={typography.h4_white_85}>Имя профиля</Text>
          <UpdateProfileForm />
        </View>

        <View style={styles.name_settings_card}>
          <Text style={typography.h4_white_85}>Аватарка</Text>
          <AvatarUploader />
        </View>

        <View style={styles.name_settings_card}>
          <Text style={typography.h4_white_85}>Изменение пароля</Text>
          <UpdatePasswordForm />
        </View>

        <View style={styles.name_settings_card}>
          <Text style={typography.h4_white_85}>Управление блокировками</Text>
          <AppButton
            title="Посмотреть заблокированных"
            style={styles.viewBlockedButton}
            onPress={() => {
              setBlockedSearch("");
              setIsBlockedModalOpen(true);
            }}
          />
        </View>

        <AppButton
          title="Выйти из профиля"
          onPress={() => navigation.navigate(ScreenName.SignOut)}
          style={styles.signOutButton}
        />
      </ScrollView>

      <Modal
        visible={isBlockedModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBlockedModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Управление блокировками</Text>
              <TouchableOpacity onPress={() => setIsBlockedModalOpen(false)}>
                <Text style={styles.closeText}>Закрыть</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={blockedSearch}
              onChangeText={setBlockedSearch}
              placeholder="Поиск"
              placeholderTextColor={COLORS.white25}
              style={styles.searchInput}
            />

            {blockedUsersQuery.error ? (
              <Text style={styles.errorText}>
                {blockedUsersQuery.error.message}
              </Text>
            ) : null}
            {blockedCommunitiesQuery.error ? (
              <Text style={styles.errorText}>
                {blockedCommunitiesQuery.error.message}
              </Text>
            ) : null}

            <Text style={styles.sectionTitle}>Заблокированные сообщества</Text>

            {isBlockedCommunitiesInitialLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator color={COLORS.white85} />
              </View>
            ) : blockedCommunities.length === 0 ? (
              <Text style={styles.emptyText}>Список пуст</Text>
            ) : (
              <FlatList
                data={blockedCommunities}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.virtualList}
                onEndReachedThreshold={0.25}
                onEndReached={() => {
                  if (
                    !blockedCommunitiesQuery.hasNextPage ||
                    blockedCommunitiesQuery.isFetchingNextPage
                  ) {
                    return;
                  }
                  void blockedCommunitiesQuery.fetchNextPage();
                }}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={styles.userInfoWrap}>
                      <Text style={styles.userName}>{item.community.name}</Text>
                      <Text style={styles.userCaption}>
                        {item.community.description || "Без описания"}
                      </Text>
                      <Text style={styles.blockedAtText}>
                        Заблокировано:{" "}
                        {new Date(item.createdAt).toLocaleString("ru-RU")}
                      </Text>
                    </View>

                    <AppButton
                      title={
                        setUserContentBlock.isPending &&
                        pendingBlockedCommunityId === item.community.id
                          ? "Сохраняем..."
                          : "Разблокировать"
                      }
                      onPress={() => {
                        void handleUnblockCommunity(item.community.id);
                      }}
                      disabled={setUserContentBlock.isPending}
                      style={styles.inlineActionButton}
                      TextStyle={styles.inlineActionButtonText}
                    />
                  </View>
                )}
                ListFooterComponent={
                  blockedCommunitiesQuery.isFetchingNextPage ? (
                    <View style={styles.listLoader}>
                      <ActivityIndicator color={COLORS.white85} />
                    </View>
                  ) : null
                }
                windowSize={8}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                removeClippedSubviews
              />
            )}

            <Text style={styles.sectionTitle}>
              Заблокированные пользователи
            </Text>

            {isBlockedUsersInitialLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator color={COLORS.white85} />
              </View>
            ) : blockedUsers.length === 0 ? (
              <Text style={styles.emptyText}>Список пуст</Text>
            ) : (
              <FlatList
                data={blockedUsers}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.virtualList}
                onEndReachedThreshold={0.25}
                onEndReached={() => {
                  if (
                    !blockedUsersQuery.hasNextPage ||
                    blockedUsersQuery.isFetchingNextPage
                  ) {
                    return;
                  }
                  void blockedUsersQuery.fetchNextPage();
                }}
                renderItem={({ item }) => (
                  <View style={styles.userRow}>
                    <View style={styles.userInfoWrap}>
                      <Text style={styles.userName}>
                        @{item.blockedUser.nickname}
                      </Text>
                      <Text style={styles.userCaption}>
                        {item.blockedUser.name || "Без имени"}
                      </Text>
                      <Text style={styles.blockedAtText}>
                        Заблокирован:{" "}
                        {new Date(item.createdAt).toLocaleString("ru-RU")}
                      </Text>
                    </View>

                    <AppButton
                      title={
                        setUserContentBlock.isPending &&
                        pendingBlockedUserId === item.blockedUser.id
                          ? "Сохраняем..."
                          : "Разблокировать"
                      }
                      onPress={() => {
                        void handleUnblockUser(item.blockedUser.id);
                      }}
                      disabled={setUserContentBlock.isPending}
                      style={styles.inlineActionButton}
                      TextStyle={styles.inlineActionButtonText}
                    />
                  </View>
                )}
                ListFooterComponent={
                  blockedUsersQuery.isFetchingNextPage ? (
                    <View style={styles.listLoader}>
                      <ActivityIndicator color={COLORS.white85} />
                    </View>
                  ) : null
                }
                windowSize={8}
                initialNumToRender={8}
                maxToRenderPerBatch={10}
                removeClippedSubviews
              />
            )}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  blockedAtText: {
    color: COLORS.white25,
    fontSize: 11,
    lineHeight: 16,
  },
  closeText: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  container: {
    flex: 1,
    padding: 14,
  },
  emptyText: {
    color: COLORS.white25,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  errorText: {
    color: ERROR_TEXT_COLOR,
    fontSize: 13,
    lineHeight: 20,
  },
  goBackWrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  inlineActionButton: {
    height: 32,
    minWidth: 128,
    paddingHorizontal: 10,
    width: "auto",
  },
  inlineActionButtonText: {
    fontSize: 13,
    lineHeight: 18,
  },
  listLoader: {
    paddingVertical: 10,
  },
  modalContent: {
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 24,
    gap: 8,
    maxHeight: "84%",
    maxWidth: SHELL_CONTENT_WIDTH,
    padding: 16,
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  modalLoadingWrap: {
    alignItems: "center",
    paddingVertical: 24,
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: MODAL_OVERLAY_BACKGROUND,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  modalTitle: {
    color: COLORS.white85,
    fontSize: 18,
    lineHeight: 24,
  },
  name_settings_card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    gap: 20,
    marginBottom: 8,
    padding: 20,
  },
  searchInput: {
    backgroundColor: COLORS.postsCardBackground,
    borderColor: COLORS.white25,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.white85,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    ...webInputFocusReset,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: COLORS.white85,
    fontSize: 15,
    lineHeight: 22,
  },
  signOutButton: {
    height: 40,
    width: "auto",
  },
  userCaption: {
    color: COLORS.white25,
    fontSize: 12,
    lineHeight: 18,
  },
  userInfoWrap: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  userName: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  userRow: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 14,
    flexDirection: "row",
    marginBottom: 8,
    padding: 10,
  },
  viewBlockedButton: {
    height: 40,
  },
  virtualList: {
    maxHeight: 180,
  },
});
