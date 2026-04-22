/* eslint-disable @typescript-eslint/no-require-imports */
import { useNavigation } from "@react-navigation/native";
import { isUserAdmin } from "@somnia/shared/src/utils/can";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../../components/ui/AppButton";
import ScreenName from "../../constants/ScreenName";
import { SHELL_CONTENT_WIDTH } from "../../constants/layout";
import { useMe } from "../../lib/ctx";
import { trpc } from "../../lib/trpc";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS, typography } from "../../theme/typography";

import type { AdminStackParamList } from "../../navigation/AdminStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const MODAL_OVERLAY_BACKGROUND = "rgba(0, 0, 0, 0.45)";
const ERROR_TEXT_COLOR = "rgba(255, 122, 122, 1)";
const DANGER_BUTTON_BACKGROUND = "rgba(255, 59, 48, 0.22)";
const DANGER_BUTTON_BORDER = "rgba(255, 59, 48, 0.8)";
const DANGER_BUTTON_TEXT = "rgba(255, 210, 210, 1)";
const ADMIN_USERS_PAGE_LIMIT = 20;
const MAX_INFINITE_PAGES = 10;

type NavigationProp = NativeStackNavigationProp<
  AdminStackParamList,
  ScreenName.AdminHome
>;

export const AdminScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const me = useMe();
  const utils = trpc.useUtils();

  const [isAdminsModalOpen, setIsAdminsModalOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [pendingAdminUserId, setPendingAdminUserId] = useState<string | null>(
    null,
  );
  const debouncedAdminSearch = useDebouncedValue(adminSearch, 350);
  const adminSearchTerm = (adminSearch ? debouncedAdminSearch : "").trim();

  const adminsListQuery = trpc.getAdminUsersList.useInfiniteQuery(
    {
      list: "ADMINS",
      search: adminSearchTerm || undefined,
      limit: ADMIN_USERS_PAGE_LIMIT,
    },
    {
      enabled: isAdminsModalOpen,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
      placeholderData: (prev) => prev,
    },
  );

  const usersListQuery = trpc.getAdminUsersList.useInfiniteQuery(
    {
      list: "USERS",
      search: adminSearchTerm || undefined,
      limit: ADMIN_USERS_PAGE_LIMIT,
    },
    {
      enabled: isAdminsModalOpen,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
      placeholderData: (prev) => prev,
    },
  );

  const setUserAdmin = trpc.setUserAdmin.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getAdminUsersList.invalidate(),
        utils.getMe.invalidate(),
      ]);
    },
  });

  const admins = useMemo(
    () => adminsListQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [adminsListQuery.data],
  );
  const users = useMemo(
    () => usersListQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [usersListQuery.data],
  );

  const isInitialLoading =
    (adminsListQuery.isLoading && !adminsListQuery.data) ||
    (usersListQuery.isLoading && !usersListQuery.data);

  const handleToggleAdmin = (userId: string, isAdmin: boolean) => {
    setPendingAdminUserId(userId);
    setUserAdmin.mutate(
      {
        userId,
        isAdmin,
      },
      {
        onSettled: () => {
          setPendingAdminUserId(null);
        },
      },
    );
  };

  if (!isUserAdmin(me)) {
    return (
      <ImageBackground
        source={require("../../assets/backgrounds/application-bg.png")}
        style={styles.backgroundImage}
      >
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View style={styles.headerContainer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.goBackWrapper}
            >
              <Image
                source={require("../../assets/Icons/navIcons/goBack.png")}
              />
              <Text style={typography.body_white85}>Назад</Text>
            </TouchableOpacity>
          </View>
          <Text style={typography.body_white85}>
            У вас нет доступа к этому экрану
          </Text>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.backgroundImage}
    >
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
            <Text style={typography.body_white85}>Назад</Text>
          </TouchableOpacity>
          <Text style={typography.body_white85}>Админ Панель</Text>
        </View>

        <View style={styles.contentWrap}>
          <TouchableOpacity
            style={styles.adminOption}
            onPress={() => {
              setAdminSearch("");
              setIsAdminsModalOpen(true);
            }}
          >
            <Text style={typography.button}>Управление администраторами</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminOption}
            onPress={() => navigation.navigate(ScreenName.DeletedPosts)}
          >
            <Text style={typography.button}>Посмотреть удаленные посты</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminOption}
            onPress={() => navigation.navigate(ScreenName.AdminReports)}
          >
            <Text style={typography.button}>Посмотреть жалобы</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.adminOption}
            onPress={() =>
              navigation.navigate(ScreenName.AdminCommunityVerificationRequests)
            }
          >
            <Text style={typography.button}>Заявки на верификацию</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={isAdminsModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAdminsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Управление админами</Text>
                <TouchableOpacity onPress={() => setIsAdminsModalOpen(false)}>
                  <Text style={styles.closeText}>Закрыть</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalScrollContent}>
                {adminsListQuery.error ? (
                  <Text style={styles.errorText}>
                    {adminsListQuery.error.message}
                  </Text>
                ) : null}
                {usersListQuery.error ? (
                  <Text style={styles.errorText}>
                    {usersListQuery.error.message}
                  </Text>
                ) : null}

                <Text style={styles.sectionTitle}>Текущие администраторы</Text>

                {isInitialLoading ? (
                  <View style={styles.modalLoadingWrap}>
                    <ActivityIndicator color={COLORS.white85} />
                  </View>
                ) : admins.length === 0 ? (
                  <Text style={styles.emptyText}>
                    Администраторы не найдены
                  </Text>
                ) : (
                  <FlatList
                    data={admins}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    style={styles.virtualList}
                    onEndReachedThreshold={0.25}
                    onEndReached={() => {
                      if (
                        !adminsListQuery.hasNextPage ||
                        adminsListQuery.isFetchingNextPage
                      ) {
                        return;
                      }

                      void adminsListQuery.fetchNextPage();
                    }}
                    renderItem={({ item: admin }) => (
                      <View style={styles.userRow}>
                        <View style={styles.userInfoWrap}>
                          <Text style={styles.userName}>@{admin.nickname}</Text>
                          <Text style={styles.userCaption}>
                            {admin.isSuperAdmin
                              ? "Супер-админ"
                              : admin.name || "Без имени"}
                          </Text>
                        </View>

                        <AppButton
                          title={
                            setUserAdmin.isPending &&
                            pendingAdminUserId === admin.id
                              ? "Сохраняем..."
                              : admin.isSuperAdmin
                                ? "Защищено"
                                : "Снять права"
                          }
                          onPress={() => handleToggleAdmin(admin.id, false)}
                          disabled={
                            setUserAdmin.isPending || admin.isSuperAdmin
                          }
                          style={styles.inlineDangerButton}
                          TextStyle={styles.inlineDangerButtonText}
                        />
                      </View>
                    )}
                    ListFooterComponent={
                      adminsListQuery.isFetchingNextPage ? (
                        <View style={styles.listLoader}>
                          <ActivityIndicator color={COLORS.white85} />
                        </View>
                      ) : null
                    }
                  />
                )}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Пользователи платформы</Text>

                <TextInput
                  placeholder="Поиск по никнейму или имени"
                  placeholderTextColor={COLORS.white25}
                  value={adminSearch}
                  onChangeText={setAdminSearch}
                  autoCapitalize="none"
                  style={styles.searchInput}
                />

                {isInitialLoading ? (
                  <View style={styles.modalLoadingWrap}>
                    <ActivityIndicator color={COLORS.white85} />
                  </View>
                ) : users.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {adminSearch.trim()
                      ? "Пользователи не найдены"
                      : "Нет пользователей для назначения"}
                  </Text>
                ) : (
                  <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    style={styles.virtualList}
                    onEndReachedThreshold={0.25}
                    onEndReached={() => {
                      if (
                        !usersListQuery.hasNextPage ||
                        usersListQuery.isFetchingNextPage
                      ) {
                        return;
                      }

                      void usersListQuery.fetchNextPage();
                    }}
                    renderItem={({ item: user }) => (
                      <View style={styles.userRow}>
                        <View style={styles.userInfoWrap}>
                          <Text style={styles.userName}>@{user.nickname}</Text>
                          <Text style={styles.userCaption}>
                            {user.name || "Без имени"}
                          </Text>
                        </View>

                        <AppButton
                          title={
                            setUserAdmin.isPending &&
                            pendingAdminUserId === user.id
                              ? "Сохраняем..."
                              : user.isAdmin
                                ? "Уже админ"
                                : "Сделать админом"
                          }
                          onPress={() => handleToggleAdmin(user.id, true)}
                          disabled={setUserAdmin.isPending || user.isAdmin}
                          style={styles.inlineActionButton}
                          TextStyle={styles.inlineActionButtonText}
                        />
                      </View>
                    )}
                    ListFooterComponent={
                      usersListQuery.isFetchingNextPage ? (
                        <View style={styles.listLoader}>
                          <ActivityIndicator color={COLORS.white85} />
                        </View>
                      ) : null
                    }
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  adminOption: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 64,
    justifyContent: "center",
    marginBottom: 8,
  },
  backgroundImage: {
    flex: 1,
  },
  closeText: {
    color: COLORS.white25,
    fontSize: 14,
    lineHeight: 20,
  },
  contentWrap: {
    flex: 1,
  },
  divider: {
    backgroundColor: COLORS.white25,
    height: 1,
    marginVertical: 8,
    width: "100%",
  },
  emptyText: {
    color: COLORS.white25,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
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
  inlineDangerButton: {
    backgroundColor: DANGER_BUTTON_BACKGROUND,
    borderColor: DANGER_BUTTON_BORDER,
    borderWidth: 1,
    height: 32,
    minWidth: 108,
    paddingHorizontal: 10,
    width: "auto",
  },
  inlineDangerButtonText: {
    color: DANGER_BUTTON_TEXT,
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
  modalScrollContent: {
    gap: 10,
  },
  modalTitle: {
    color: COLORS.white85,
    fontSize: 18,
    lineHeight: 24,
  },
  safeArea: {
    flex: 1,
    marginBottom: 20,
    marginHorizontal: 14,
  },
  searchInput: {
    backgroundColor: COLORS.postsCardBackground,
    borderColor: COLORS.white25,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.white85,
    ...webInputFocusReset,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: COLORS.white85,
    fontSize: 15,
    lineHeight: 22,
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
  virtualList: {
    maxHeight: 180,
  },
});
