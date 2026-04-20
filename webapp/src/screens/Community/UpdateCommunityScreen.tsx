/* eslint-disable @typescript-eslint/no-require-imports */
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CommunityAvatarUploader } from "../../components/forms/CommunityAvatarUploader";
import { UpdateCommunityForm } from "../../components/forms/UpdateCommunityForm";
import { AppButton } from "../../components/ui/AppButton";
import ScreenName from "../../constants/ScreenName";
import { getAvatarSource } from "../../lib/avatar";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { AdminStackParamList } from "../../navigation/AdminStackParamList";
import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { ProfileStackParamList } from "../../navigation/ProfileStackParamList";
import type { SearchStackParamList } from "../../navigation/SearchStackParamList";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const MODAL_OVERLAY_BACKGROUND = "rgba(0, 0, 0, 0.45)";
const DANGER_BUTTON_BACKGROUND = "rgba(255, 59, 48, 0.22)";
const DANGER_BUTTON_BORDER = "rgba(255, 59, 48, 0.8)";
const DANGER_BUTTON_TEXT = "rgba(255, 210, 210, 1)";

type UpdateCommunityRouteParams = {
  [ScreenName.UpdateCommunity]: {
    id: string;
  };
};

type UpdateCommunityRouteProp = RouteProp<
  UpdateCommunityRouteParams,
  ScreenName.UpdateCommunity
>;

type UpdateCommunityNavProp = NativeStackNavigationProp<
  FeedStackParamList &
    SearchStackParamList &
    ProfileStackParamList &
    AdminStackParamList,
  ScreenName.UpdateCommunity
>;

type UpdatedCommunity = {
  avatar: string | null;
  description: string;
  id: string;
  name: string;
};

export const UpdateCommunityScreen = () => {
  const route = useRoute<UpdateCommunityRouteProp>();
  const navigation = useNavigation<UpdateCommunityNavProp>();
  const utils = trpc.useUtils();

  const [isModeratorsModalOpen, setIsModeratorsModalOpen] = useState(false);
  const [isTransferOwnershipModalOpen, setIsTransferOwnershipModalOpen] =
    useState(false);
  const [moderatorSearch, setModeratorSearch] = useState("");
  const [transferOwnershipSearch, setTransferOwnershipSearch] = useState("");
  const [pendingModeratorUserId, setPendingModeratorUserId] = useState<
    string | null
  >(null);
  const [pendingOwnershipUserId, setPendingOwnershipUserId] = useState<
    string | null
  >(null);

  const communityId = route.params.id;
  const communityQuery = trpc.getCommunity.useQuery({
    id: communityId,
  });

  const moderationQuery = trpc.getCommunityModeration.useQuery(
    {
      communityId,
    },
    {
      enabled: isModeratorsModalOpen || isTransferOwnershipModalOpen,
    },
  );

  const setCommunityModerator = trpc.setCommunityModerator.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getCommunityModeration.invalidate({
          communityId,
        }),
        utils.getCommunity.invalidate({ id: communityId }),
        utils.getMyPublishingIdentities.invalidate(),
      ]);
    },
  });

  const deleteCommunity = trpc.deleteCommunity.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getCommunity.invalidate({ id: communityId }),
        utils.getCommunityPosts.invalidate(),
        utils.getPosts.invalidate(),
        utils.getSubscribedPosts.invalidate(),
        utils.getRatedPosts.invalidate(),
        utils.getMyPublishingIdentities.invalidate(),
      ]);

      navigation.pop(2);
    },
  });
  const transferCommunityOwnership =
    trpc.transferCommunityOwnership.useMutation({
      onSuccess: async () => {
        await Promise.all([
          utils.getCommunity.invalidate({ id: communityId }),
          utils.getCommunityModeration.invalidate({
            communityId,
          }),
          utils.getMyPublishingIdentities.invalidate(),
        ]);

        setIsTransferOwnershipModalOpen(false);
        navigation.goBack();
      },
    });

  const applyCommunityUpdate = (updatedCommunity: UpdatedCommunity) => {
    utils.getCommunity.setData({ id: communityId }, (oldData) => {
      if (!oldData?.community) {
        return oldData;
      }

      return {
        ...oldData,
        community: {
          ...oldData.community,
          ...updatedCommunity,
        },
      };
    });

    void Promise.all([
      utils.getPosts.invalidate(),
      utils.getSubscribedPosts.invalidate(),
      utils.getRatedPosts.invalidate(),
      utils.getCommunityPosts.invalidate(),
      utils.getMyPublishingIdentities.invalidate(),
    ]);
  };

  const moderators = useMemo(
    () => moderationQuery.data?.moderators ?? [],
    [moderationQuery.data?.moderators],
  );
  const nonModeratorSubscribers = useMemo(
    () =>
      (moderationQuery.data?.subscribers ?? []).filter(
        (subscriber) => !subscriber.isModerator,
      ),
    [moderationQuery.data?.subscribers],
  );
  const subscribers = useMemo(
    () =>
      nonModeratorSubscribers.filter((subscriber) => {
        const normalizedSearch = moderatorSearch.trim().toLowerCase();
        if (!normalizedSearch) {
          return true;
        }

        return subscriber.nickname.toLowerCase().includes(normalizedSearch);
      }),
    [nonModeratorSubscribers, moderatorSearch],
  );
  const transferModerators = useMemo(
    () =>
      moderators.filter((moderator) => {
        const normalizedSearch = transferOwnershipSearch.trim().toLowerCase();
        if (!normalizedSearch) {
          return true;
        }

        return moderator.nickname.toLowerCase().includes(normalizedSearch);
      }),
    [moderators, transferOwnershipSearch],
  );
  const transferSubscribers = useMemo(
    () =>
      nonModeratorSubscribers.filter((subscriber) => {
        const normalizedSearch = transferOwnershipSearch.trim().toLowerCase();
        if (!normalizedSearch) {
          return true;
        }

        return subscriber.nickname.toLowerCase().includes(normalizedSearch);
      }),
    [nonModeratorSubscribers, transferOwnershipSearch],
  );
  const isModerationInitialLoading =
    moderationQuery.isLoading && !moderationQuery.data;

  const handleToggleModerator = (userId: string, isModerator: boolean) => {
    setPendingModeratorUserId(userId);
    setCommunityModerator.mutate(
      {
        communityId,
        userId,
        isModerator,
      },
      {
        onSettled: () => {
          setPendingModeratorUserId(null);
        },
      },
    );
  };

  const handleDeleteCommunity = () => {
    const executeDelete = async () => {
      try {
        await deleteCommunity.mutateAsync({
          communityId,
        });
      } catch (error) {
        Alert.alert(
          "Ошибка",
          error instanceof Error
            ? error.message
            : "Не удалось удалить сообщество",
        );
      }
    };

    if (Platform.OS === "web") {
      const shouldDelete =
        typeof window !== "undefined"
          ? window.confirm("Удалить сообщество? Это действие нельзя отменить.")
          : true;
      if (!shouldDelete) {
        return;
      }

      void executeDelete();
      return;
    }

    Alert.alert(
      "Удалить сообщество?",
      "Это действие нельзя отменить.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            void executeDelete();
          },
        },
      ],
      { cancelable: true },
    );
  };
  const handleTransferOwnership = ({
    userId,
    nickname,
  }: {
    userId: string;
    nickname: string;
  }) => {
    const executeTransferOwnership = async () => {
      setPendingOwnershipUserId(userId);
      try {
        await transferCommunityOwnership.mutateAsync({
          communityId,
          newOwnerUserId: userId,
        });
      } catch (error) {
        Alert.alert(
          "Ошибка",
          error instanceof Error
            ? error.message
            : "Не удалось передать владение",
        );
      } finally {
        setPendingOwnershipUserId(null);
      }
    };

    const confirmationText = `Передать владение пользователю @${nickname}? После этого вы станете модератором.`;
    if (Platform.OS === "web") {
      const shouldTransferOwnership =
        typeof window !== "undefined" ? window.confirm(confirmationText) : true;
      if (!shouldTransferOwnership) {
        return;
      }

      void executeTransferOwnership();
      return;
    }

    Alert.alert(
      "Передать владение?",
      confirmationText,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Передать",
          style: "destructive",
          onPress: () => {
            void executeTransferOwnership();
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (communityQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.white85} size="large" />
      </View>
    );
  }

  if (communityQuery.error || !communityQuery.data?.community) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body_white85}>
          {communityQuery.error?.message ?? "Сообщество не найдено"}
        </Text>
      </View>
    );
  }

  const community = communityQuery.data.community;
  if (community.myRole !== "OWNER") {
    return (
      <ImageBackground
        source={require("../../assets/backgrounds/application-bg.png")}
        style={styles.backgroundImage}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
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

          <View style={styles.deniedCard}>
            <Text style={typography.body_white85}>
              Только владелец может управлять настройками сообщества.
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
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

          <View style={styles.settingsCard}>
            <Image
              source={getAvatarSource(community.avatar, "small")}
              style={styles.communityPreviewAvatar}
            />
            <View style={styles.communityPreviewTextWrap}>
              <Text style={typography.body_white85}>{community.name}</Text>
              <Text style={typography.additionalInfo_white25}>
                {community.description || "Без описания"}
              </Text>
            </View>
          </View>

          <View style={styles.settingsCard}>
            <Text style={typography.h4_white_85}>
              Имя и описание сообщества
            </Text>
            <UpdateCommunityForm
              communityId={community.id}
              name={community.name}
              description={community.description}
              onUpdated={applyCommunityUpdate}
            />
          </View>

          <View style={styles.settingsCard}>
            <Text style={typography.h4_white_85}>Аватарка сообщества</Text>
            <CommunityAvatarUploader
              communityId={community.id}
              avatar={community.avatar}
              onUpdated={applyCommunityUpdate}
            />
          </View>

          <View style={styles.settingsCard}>
            <Text style={typography.h4_white_85}>Модераторы</Text>
            <AppButton
              title="Настроить модераторов"
              onPress={() => {
                setModeratorSearch("");
                setIsModeratorsModalOpen(true);
              }}
              style={styles.actionButton}
            />
          </View>

          <View style={styles.settingsCard}>
            <Text style={typography.h4_white_85}>Передача владения</Text>
            <AppButton
              title="Передать владение"
              onPress={() => {
                setTransferOwnershipSearch("");
                setIsTransferOwnershipModalOpen(true);
              }}
              style={styles.actionButton}
            />
          </View>

          <View style={styles.settingsCard}>
            <Text style={typography.h4_white_85}>Опасная зона</Text>
            <AppButton
              title={
                deleteCommunity.isPending
                  ? "Удаляем сообщество..."
                  : "Удалить сообщество"
              }
              onPress={handleDeleteCommunity}
              disabled={deleteCommunity.isPending}
              style={styles.dangerButton}
              TextStyle={styles.dangerButtonText}
            />
          </View>
        </ScrollView>

        <Modal
          visible={isModeratorsModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsModeratorsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Настройка модераторов</Text>
                <TouchableOpacity
                  onPress={() => setIsModeratorsModalOpen(false)}
                >
                  <Text style={styles.closeText}>Закрыть</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {moderationQuery.error ? (
                  <Text style={styles.errorText}>
                    {moderationQuery.error.message}
                  </Text>
                ) : null}

                <Text style={styles.sectionTitle}>Текущие модераторы</Text>

                {isModerationInitialLoading ? (
                  <View style={styles.modalLoadingWrap}>
                    <ActivityIndicator color={COLORS.white85} />
                  </View>
                ) : moderators.length === 0 ? (
                  <Text style={styles.emptyText}>Пока нет модераторов</Text>
                ) : (
                  moderators.map((moderator) => (
                    <View key={moderator.id} style={styles.userRow}>
                      <View style={styles.userInfoWrap}>
                        <Text style={styles.userName}>
                          @{moderator.nickname}
                        </Text>
                        <Text style={styles.userCaption}>
                          {moderator.name || "Без имени"}
                        </Text>
                      </View>

                      <AppButton
                        title={
                          setCommunityModerator.isPending &&
                          pendingModeratorUserId === moderator.id
                            ? "Сохраняем..."
                            : "Снять с поста"
                        }
                        onPress={() =>
                          handleToggleModerator(moderator.id, false)
                        }
                        disabled={setCommunityModerator.isPending}
                        style={styles.inlineDangerButton}
                        TextStyle={styles.inlineDangerButtonText}
                      />
                    </View>
                  ))
                )}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Подписчики сообщества</Text>

                <TextInput
                  placeholder="Поиск по никнейму"
                  placeholderTextColor={COLORS.white25}
                  value={moderatorSearch}
                  onChangeText={setModeratorSearch}
                  autoCapitalize="none"
                  style={styles.searchInput}
                />

                {isModerationInitialLoading ? (
                  <View style={styles.modalLoadingWrap}>
                    <ActivityIndicator color={COLORS.white85} />
                  </View>
                ) : subscribers.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {moderatorSearch.trim()
                      ? "Подписчики не найдены"
                      : "Нет подписчиков для назначения"}
                  </Text>
                ) : (
                  subscribers.map((subscriber) => (
                    <View key={subscriber.id} style={styles.userRow}>
                      <View style={styles.userInfoWrap}>
                        <Text style={styles.userName}>
                          @{subscriber.nickname}
                        </Text>
                        <Text style={styles.userCaption}>
                          {subscriber.name || "Без имени"}
                        </Text>
                      </View>

                      <AppButton
                        title={
                          setCommunityModerator.isPending &&
                          pendingModeratorUserId === subscriber.id
                            ? "Сохраняем..."
                            : "Сделать модератором"
                        }
                        onPress={() =>
                          handleToggleModerator(subscriber.id, true)
                        }
                        disabled={setCommunityModerator.isPending}
                        style={styles.inlineActionButton}
                        TextStyle={styles.inlineActionButtonText}
                      />
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        <Modal
          visible={isTransferOwnershipModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsTransferOwnershipModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Передача владения</Text>
                <TouchableOpacity
                  onPress={() => setIsTransferOwnershipModalOpen(false)}
                >
                  <Text style={styles.closeText}>Закрыть</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.warningText}>
                  Выберите нового владельца. После передачи владения вы станете
                  модератором.
                </Text>

                {moderationQuery.error ? (
                  <Text style={styles.errorText}>
                    {moderationQuery.error.message}
                  </Text>
                ) : null}

                <TextInput
                  placeholder="Поиск по никнейму"
                  placeholderTextColor={COLORS.white25}
                  value={transferOwnershipSearch}
                  onChangeText={setTransferOwnershipSearch}
                  autoCapitalize="none"
                  style={styles.searchInput}
                />

                <Text style={styles.sectionTitle}>Текущие модераторы</Text>

                {isModerationInitialLoading ? (
                  <View style={styles.modalLoadingWrap}>
                    <ActivityIndicator color={COLORS.white85} />
                  </View>
                ) : transferModerators.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {transferOwnershipSearch.trim()
                      ? "Модераторы не найдены"
                      : "Пока нет модераторов"}
                  </Text>
                ) : (
                  transferModerators.map((moderator) => (
                    <View key={moderator.id} style={styles.userRow}>
                      <View style={styles.userInfoWrap}>
                        <Text style={styles.userName}>
                          @{moderator.nickname}
                        </Text>
                        <Text style={styles.userCaption}>
                          {moderator.name || "Без имени"}
                        </Text>
                      </View>

                      <AppButton
                        title={
                          transferCommunityOwnership.isPending &&
                          pendingOwnershipUserId === moderator.id
                            ? "Сохраняем..."
                            : "Передать владение"
                        }
                        onPress={() =>
                          handleTransferOwnership({
                            userId: moderator.id,
                            nickname: moderator.nickname,
                          })
                        }
                        disabled={transferCommunityOwnership.isPending}
                        style={styles.inlineDangerButton}
                        TextStyle={styles.inlineDangerButtonText}
                      />
                    </View>
                  ))
                )}

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Подписчики сообщества</Text>

                {isModerationInitialLoading ? (
                  <View style={styles.modalLoadingWrap}>
                    <ActivityIndicator color={COLORS.white85} />
                  </View>
                ) : transferSubscribers.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {transferOwnershipSearch.trim()
                      ? "Подписчики не найдены"
                      : "Нет подписчиков для передачи владения"}
                  </Text>
                ) : (
                  transferSubscribers.map((subscriber) => (
                    <View key={subscriber.id} style={styles.userRow}>
                      <View style={styles.userInfoWrap}>
                        <Text style={styles.userName}>
                          @{subscriber.nickname}
                        </Text>
                        <Text style={styles.userCaption}>
                          {subscriber.name || "Без имени"}
                        </Text>
                      </View>

                      <AppButton
                        title={
                          transferCommunityOwnership.isPending &&
                          pendingOwnershipUserId === subscriber.id
                            ? "Сохраняем..."
                            : "Передать владение"
                        }
                        onPress={() =>
                          handleTransferOwnership({
                            userId: subscriber.id,
                            nickname: subscriber.nickname,
                          })
                        }
                        disabled={transferCommunityOwnership.isPending}
                        style={styles.inlineDangerButton}
                        TextStyle={styles.inlineDangerButtonText}
                      />
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
        <StatusBar style="auto" />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    height: 40,
  },
  backgroundImage: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  closeText: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  communityPreviewAvatar: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  communityPreviewTextWrap: {
    flex: 1,
    gap: 2,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  dangerButton: {
    backgroundColor: DANGER_BUTTON_BACKGROUND,
    borderColor: DANGER_BUTTON_BORDER,
    borderWidth: 1,
    height: 40,
  },
  dangerButtonText: {
    color: DANGER_BUTTON_TEXT,
    fontSize: 16,
  },
  deniedCard: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 24,
    marginTop: 16,
    padding: 16,
  },
  divider: {
    backgroundColor: COLORS.white25,
    height: 1,
    marginVertical: 14,
    opacity: 0.6,
  },
  emptyText: {
    color: COLORS.white25,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: COLORS.white85,
    fontSize: 12,
    lineHeight: 18,
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
    marginBottom: 16,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  inlineActionButton: {
    height: 32,
    minWidth: 154,
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
    minWidth: 114,
    paddingHorizontal: 10,
    width: "auto",
  },
  inlineDangerButtonText: {
    color: DANGER_BUTTON_TEXT,
    fontSize: 13,
    lineHeight: 18,
  },
  modalContent: {
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 24,
    maxHeight: "84%",
    padding: 16,
    width: "92%",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
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
  modalScroll: {
    maxHeight: 500,
  },
  modalScrollContent: {
    gap: 8,
    paddingBottom: 8,
  },
  modalTitle: {
    color: COLORS.white85,
    fontSize: 18,
    lineHeight: 24,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  searchInput: {
    backgroundColor: COLORS.postsCardBackground,
    borderColor: COLORS.white25,
    borderRadius: 14,
    borderWidth: 1,
    color: COLORS.white85,
    ...(Platform.OS === "web" ? { fontSize: 16 } : {}),
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sectionTitle: {
    color: COLORS.white85,
    fontSize: 15,
    lineHeight: 22,
  },
  settingsCard: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    gap: 12,
    marginBottom: 8,
    padding: 20,
  },
  userCaption: {
    color: COLORS.white25,
    fontSize: 12,
    lineHeight: 18,
  },
  userInfoWrap: {
    flex: 1,
    gap: 2,
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
    gap: 10,
    padding: 10,
  },
  warningText: {
    color: COLORS.white85,
    fontSize: 13,
    lineHeight: 19,
  },
});
