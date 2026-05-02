/* eslint-disable @typescript-eslint/no-require-imports */
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CommunityAvatarUploader } from "../../components/forms/CommunityAvatarUploader";
import { UpdateCommunityForm } from "../../components/forms/UpdateCommunityForm";
import { AppScreen } from "../../components/layout/AppScreen";
import { AppButton } from "../../components/ui/AppButton";
import ScreenName from "../../constants/ScreenName";
import { SHELL_CONTENT_WIDTH } from "../../constants/layout";
import { getAvatarSource } from "../../lib/avatar";
import { trpc } from "../../lib/trpc";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { webInputFocusReset } from "../../theme/inputFocus";
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
const ACTION_LOG_PAGE_LIMIT = 30;
const MODERATION_LIST_PAGE_LIMIT = 20;
const MAX_INFINITE_PAGES = 10;

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

type BlacklistDuration = "PERMANENT" | "DAY" | "WEEK" | "MONTH";
type BlockedUserItem = {
  id: string;
  nickname: string;
  name: string;
  avatar: string | null;
  blockedAt: Date;
  expiresAt: Date | null;
  blockedBy: {
    id: string;
    nickname: string;
    name: string;
    avatar: string | null;
  };
};

const BLACKLIST_DURATION_OPTIONS: Array<{
  label: string;
  value: BlacklistDuration;
}> = [
  { label: "Навсегда", value: "PERMANENT" },
  { label: "24 часа", value: "DAY" },
  { label: "Неделя", value: "WEEK" },
  { label: "Месяц", value: "MONTH" },
];

const VERIFICATION_STATUS_LABELS: Record<
  "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED",
  string
> = {
  OPEN: "Открыта",
  IN_REVIEW: "В работе",
  RESOLVED: "Одобрена",
  REJECTED: "Отклонена",
};

export const UpdateCommunityScreen = () => {
  const route = useRoute<UpdateCommunityRouteProp>();
  const navigation = useNavigation<UpdateCommunityNavProp>();
  const utils = trpc.useUtils();

  const [isModeratorsModalOpen, setIsModeratorsModalOpen] = useState(false);
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
  const [isActionLogModalOpen, setIsActionLogModalOpen] = useState(false);
  const [isTransferOwnershipModalOpen, setIsTransferOwnershipModalOpen] =
    useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [moderatorSearch, setModeratorSearch] = useState("");
  const [blacklistSearch, setBlacklistSearch] = useState("");
  const [transferOwnershipSearch, setTransferOwnershipSearch] = useState("");
  const [verificationContact, setVerificationContact] = useState("");
  const [blacklistDuration, setBlacklistDuration] =
    useState<BlacklistDuration>("PERMANENT");
  const [pendingModeratorUserId, setPendingModeratorUserId] = useState<
    string | null
  >(null);
  const [pendingBlacklistUserId, setPendingBlacklistUserId] = useState<
    string | null
  >(null);
  const [pendingOwnershipUserId, setPendingOwnershipUserId] = useState<
    string | null
  >(null);
  const debouncedModeratorSearch = useDebouncedValue(moderatorSearch, 350);
  const moderatorSearchTerm = (
    moderatorSearch ? debouncedModeratorSearch : ""
  ).trim();
  const debouncedBlacklistSearch = useDebouncedValue(blacklistSearch, 350);
  const blacklistSearchTerm = (
    blacklistSearch ? debouncedBlacklistSearch : ""
  ).trim();
  const debouncedTransferOwnershipSearch = useDebouncedValue(
    transferOwnershipSearch,
    350,
  );
  const transferOwnershipSearchTerm = (
    transferOwnershipSearch ? debouncedTransferOwnershipSearch : ""
  ).trim();

  const communityId = route.params.id;
  const communityQuery = trpc.getCommunity.useQuery({
    id: communityId,
  });

  const moderatorsListQuery = trpc.getCommunityModerationList.useInfiniteQuery(
    {
      communityId,
      list: "MODERATORS",
      search: moderatorSearchTerm || undefined,
      limit: MODERATION_LIST_PAGE_LIMIT,
    },
    {
      enabled: isModeratorsModalOpen,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
      placeholderData: (prev) => prev,
    },
  );
  const subscribersListQuery = trpc.getCommunityModerationList.useInfiniteQuery(
    {
      communityId,
      list: "SUBSCRIBERS",
      search: moderatorSearchTerm || undefined,
      limit: MODERATION_LIST_PAGE_LIMIT,
    },
    {
      enabled: isModeratorsModalOpen,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
      placeholderData: (prev) => prev,
    },
  );
  const transferModeratorsListQuery =
    trpc.getCommunityModerationList.useInfiniteQuery(
      {
        communityId,
        list: "MODERATORS",
        search: transferOwnershipSearchTerm || undefined,
        limit: MODERATION_LIST_PAGE_LIMIT,
      },
      {
        enabled: isTransferOwnershipModalOpen,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        maxPages: MAX_INFINITE_PAGES,
        placeholderData: (prev) => prev,
      },
    );
  const transferSubscribersListQuery =
    trpc.getCommunityModerationList.useInfiniteQuery(
      {
        communityId,
        list: "SUBSCRIBERS",
        search: transferOwnershipSearchTerm || undefined,
        limit: MODERATION_LIST_PAGE_LIMIT,
      },
      {
        enabled: isTransferOwnershipModalOpen,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        maxPages: MAX_INFINITE_PAGES,
        placeholderData: (prev) => prev,
      },
    );
  const blacklistSubscribersListQuery =
    trpc.getCommunityModerationList.useInfiniteQuery(
      {
        communityId,
        list: "SUBSCRIBERS",
        search: blacklistSearchTerm || undefined,
        limit: MODERATION_LIST_PAGE_LIMIT,
      },
      {
        enabled: isBlacklistModalOpen,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        maxPages: MAX_INFINITE_PAGES,
        placeholderData: (prev) => prev,
      },
    );
  const blacklistUsersListQuery =
    trpc.getCommunityModerationList.useInfiniteQuery(
      {
        communityId,
        list: "BLACKLIST",
        search: blacklistSearchTerm || undefined,
        limit: MODERATION_LIST_PAGE_LIMIT,
      },
      {
        enabled: isBlacklistModalOpen,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        maxPages: MAX_INFINITE_PAGES,
        placeholderData: (prev) => prev,
      },
    );
  const actionLogQuery = trpc.getCommunityActionLog.useInfiniteQuery(
    {
      communityId,
      limit: ACTION_LOG_PAGE_LIMIT,
    },
    {
      enabled: isActionLogModalOpen,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
    },
  );

  const setCommunityModerator = trpc.setCommunityModerator.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getCommunityModerationList.invalidate(),
        utils.getCommunityActionLog.invalidate({
          communityId,
          limit: ACTION_LOG_PAGE_LIMIT,
        }),
        utils.getCommunity.invalidate({ id: communityId }),
        utils.getMyPublishingIdentities.invalidate(),
      ]);
    },
  });
  const setCommunityBlacklist = trpc.setCommunityBlacklist.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getCommunityModerationList.invalidate(),
        utils.getCommunity.invalidate({ id: communityId }),
        utils.getCommunityPosts.invalidate(),
        utils.getPosts.invalidate(),
        utils.getSubscribedPosts.invalidate(),
        utils.getRatedPosts.invalidate(),
        utils.getCommunityActionLog.invalidate({
          communityId,
          limit: ACTION_LOG_PAGE_LIMIT,
        }),
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
          utils.getCommunityModerationList.invalidate(),
          utils.getCommunityActionLog.invalidate({
            communityId,
            limit: ACTION_LOG_PAGE_LIMIT,
          }),
          utils.getMyPublishingIdentities.invalidate(),
        ]);

        setIsTransferOwnershipModalOpen(false);
        navigation.goBack();
      },
    });
  const createCommunityVerificationRequest =
    trpc.createCommunityVerificationRequest.useMutation({
      onSuccess: async () => {
        await utils.getCommunity.invalidate({ id: communityId });
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
    () => moderatorsListQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [moderatorsListQuery.data],
  );
  const subscribers = useMemo(
    () => subscribersListQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [subscribersListQuery.data],
  );
  const transferModerators = useMemo(
    () =>
      transferModeratorsListQuery.data?.pages.flatMap((page) => page.items) ??
      [],
    [transferModeratorsListQuery.data],
  );
  const transferSubscribers = useMemo(
    () =>
      transferSubscribersListQuery.data?.pages.flatMap((page) => page.items) ??
      [],
    [transferSubscribersListQuery.data],
  );
  const blacklistSubscribers = useMemo(
    () =>
      blacklistSubscribersListQuery.data?.pages.flatMap((page) => page.items) ??
      [],
    [blacklistSubscribersListQuery.data],
  );
  const blockedUsers = useMemo(
    () =>
      (blacklistUsersListQuery.data?.pages.flatMap((page) => page.items) ??
        []) as BlockedUserItem[],
    [blacklistUsersListQuery.data],
  );
  const isModeratorsInitialLoading =
    (moderatorsListQuery.isLoading && !moderatorsListQuery.data) ||
    (subscribersListQuery.isLoading && !subscribersListQuery.data);
  const isTransferInitialLoading =
    (transferModeratorsListQuery.isLoading &&
      !transferModeratorsListQuery.data) ||
    (transferSubscribersListQuery.isLoading &&
      !transferSubscribersListQuery.data);
  const isBlacklistInitialLoading =
    (blacklistSubscribersListQuery.isLoading &&
      !blacklistSubscribersListQuery.data) ||
    (blacklistUsersListQuery.isLoading && !blacklistUsersListQuery.data);
  const actionLogs = useMemo(
    () => actionLogQuery.data?.pages.flatMap((page) => page.actions) ?? [],
    [actionLogQuery.data],
  );
  const isActionLogInitialLoading =
    actionLogQuery.isLoading && !actionLogQuery.data;

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
  const handleToggleBlacklist = (userId: string, isBlocked: boolean) => {
    setPendingBlacklistUserId(userId);
    setCommunityBlacklist.mutate(
      {
        communityId,
        userId,
        isBlocked,
        ...(isBlocked ? { duration: blacklistDuration } : {}),
      },
      {
        onSettled: () => {
          setPendingBlacklistUserId(null);
        },
      },
    );
  };

  const formatBlacklistExpiration = (expiresAt: Date | null) => {
    if (!expiresAt) {
      return "Навсегда";
    }

    return `До ${new Date(expiresAt).toLocaleString("ru-RU")}`;
  };

  const getActionText = (action: {
    actionType: string;
    actor: { nickname: string } | null;
    targetUser: { nickname: string } | null;
    post: { title: string } | null;
  }) => {
    const actor = action.actor ? `@${action.actor.nickname}` : "Система";
    const target = action.targetUser
      ? `@${action.targetUser.nickname}`
      : "пользователя";

    if (action.actionType === "BLACKLIST_ADDED") {
      return `${actor} добавил(а) ${target} в ЧС`;
    }

    if (action.actionType === "BLACKLIST_REMOVED") {
      return `${actor} убрал(а) ${target} из ЧС`;
    }

    if (action.actionType === "MODERATOR_ASSIGNED") {
      return `${actor} назначил(а) ${target} модератором`;
    }

    if (action.actionType === "MODERATOR_REVOKED") {
      return `${actor} снял(а) ${target} с поста модератора`;
    }

    if (action.actionType === "OWNERSHIP_TRANSFERRED") {
      return `${actor} передал(а) владение ${target}`;
    }

    if (action.actionType === "POST_PUBLISHED") {
      return `${actor} опубликовал(а) пост`;
    }

    if (action.actionType === "POST_UPDATED") {
      return `${actor} изменил(а) пост`;
    }

    if (action.actionType === "POST_DELETED") {
      return `${actor} удалил(а) пост`;
    }

    if (action.actionType === "COMMUNITY_UPDATED") {
      return `${actor} обновил(а) название или описание сообщества`;
    }

    if (action.actionType === "COMMUNITY_AVATAR_UPDATED") {
      return `${actor} обновил(а) аватарку сообщества`;
    }

    if (action.post?.title) {
      return `${actor} выполнил(а) действие с постом "${action.post.title}"`;
    }

    return `${actor} выполнил(а) действие`;
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
  const canManageCommunity =
    community.myRole === "OWNER" || community.myRole === "MODERATOR";
  const isOwner = community.myRole === "OWNER";
  const latestVerificationRequest = community.latestVerificationRequest;
  const trimmedVerificationContact = verificationContact.trim();
  const isVerificationContactInvalid =
    trimmedVerificationContact.length < 3 ||
    trimmedVerificationContact.length > 200;

  if (!canManageCommunity) {
    return (
      <AppScreen contentStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
            <Text style={typography.body_white85}>Назад</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.deniedCard}>
          <Text style={typography.body_white85}>
            Только владелец или модератор могут управлять сообществом.
          </Text>
        </View>
      </AppScreen>
    );
  }

  const handleSubmitVerificationRequest = async () => {
    if (!isOwner) {
      return;
    }

    if (isVerificationContactInvalid) {
      Alert.alert("Ошибка", "Контакт должен быть от 3 до 200 символов");
      return;
    }

    try {
      await createCommunityVerificationRequest.mutateAsync({
        communityId,
        contact: trimmedVerificationContact,
      });
      setIsVerificationModalOpen(false);
      setVerificationContact("");
      Alert.alert("Готово", "Заявка на верификацию отправлена");
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error
          ? error.message
          : "Не удалось отправить заявку на верификацию",
      );
    }
  };

  return (
    <AppScreen contentStyle={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
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

        {isOwner ? (
          <>
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
              <Text style={typography.h4_white_85}>Верификация сообщества</Text>
              <Text style={styles.warningText}>
                {latestVerificationRequest
                  ? `Последняя заявка: ${VERIFICATION_STATUS_LABELS[latestVerificationRequest.status]} (${new Date(latestVerificationRequest.createdAt).toLocaleString("ru-RU")})`
                  : "Заявок на верификацию пока не было"}
              </Text>
              <AppButton
                title="Пройти верификацию"
                onPress={() => {
                  setVerificationContact("");
                  setIsVerificationModalOpen(true);
                }}
                style={styles.actionButton}
              />
            </View>
          </>
        ) : null}

        <View style={styles.settingsCard}>
          <Text style={typography.h4_white_85}>Управление черными спискам</Text>
          <AppButton
            title="Открыть управление"
            onPress={() => {
              setBlacklistSearch("");
              setIsBlacklistModalOpen(true);
            }}
            style={styles.actionButton}
          />
        </View>

        <View style={styles.settingsCard}>
          <Text style={typography.h4_white_85}>
            Просмотр действий сообщества
          </Text>
          <AppButton
            title="Открыть журнал"
            onPress={() => {
              setIsActionLogModalOpen(true);
              void actionLogQuery.refetch();
            }}
            style={styles.actionButton}
          />
        </View>

        {isOwner ? (
          <>
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
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={isVerificationModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVerificationModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Запрос верификации</Text>
              <TouchableOpacity
                onPress={() => setIsVerificationModalOpen(false)}
              >
                <Text style={styles.closeText}>Закрыть</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalScrollContent}>
              <Text style={styles.warningText}>
                Укажите контакт для обратной связи.
              </Text>
              <TextInput
                placeholder="Email, Telegram или другой контакт"
                placeholderTextColor={COLORS.white25}
                value={verificationContact}
                onChangeText={setVerificationContact}
                maxLength={200}
                autoCapitalize="none"
                style={styles.searchInput}
              />
              <Text style={styles.logMeta}>
                {trimmedVerificationContact.length}/200
              </Text>
              <AppButton
                title={
                  createCommunityVerificationRequest.isPending
                    ? "Отправляем..."
                    : "Отправить запрос"
                }
                onPress={handleSubmitVerificationRequest}
                disabled={
                  createCommunityVerificationRequest.isPending ||
                  isVerificationContactInvalid
                }
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>
      </Modal>

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
              <TouchableOpacity onPress={() => setIsModeratorsModalOpen(false)}>
                <Text style={styles.closeText}>Закрыть</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalScrollContent}>
              {moderatorsListQuery.error ? (
                <Text style={styles.errorText}>
                  {moderatorsListQuery.error.message}
                </Text>
              ) : null}
              {subscribersListQuery.error ? (
                <Text style={styles.errorText}>
                  {subscribersListQuery.error.message}
                </Text>
              ) : null}

              <Text style={styles.sectionTitle}>Текущие модераторы</Text>

              {isModeratorsInitialLoading ? (
                <View style={styles.modalLoadingWrap}>
                  <ActivityIndicator color={COLORS.white85} />
                </View>
              ) : moderators.length === 0 ? (
                <Text style={styles.emptyText}>Пока нет модераторов</Text>
              ) : (
                <FlatList
                  data={moderators}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.virtualList}
                  onEndReachedThreshold={0.25}
                  onEndReached={() => {
                    if (
                      !moderatorsListQuery.hasNextPage ||
                      moderatorsListQuery.isFetchingNextPage
                    ) {
                      return;
                    }
                    void moderatorsListQuery.fetchNextPage();
                  }}
                  renderItem={({ item: moderator }) => (
                    <View style={styles.userRow}>
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
                  )}
                  ListFooterComponent={
                    moderatorsListQuery.isFetchingNextPage ? (
                      <View style={styles.listLoader}>
                        <ActivityIndicator color={COLORS.white85} />
                      </View>
                    ) : null
                  }
                />
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

              {isModeratorsInitialLoading ? (
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
                <FlatList
                  data={subscribers}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.virtualList}
                  onEndReachedThreshold={0.25}
                  onEndReached={() => {
                    if (
                      !subscribersListQuery.hasNextPage ||
                      subscribersListQuery.isFetchingNextPage
                    ) {
                      return;
                    }
                    void subscribersListQuery.fetchNextPage();
                  }}
                  renderItem={({ item: subscriber }) => (
                    <View style={styles.userRow}>
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
                  )}
                  ListFooterComponent={
                    subscribersListQuery.isFetchingNextPage ? (
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
      <Modal
        visible={isBlacklistModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBlacklistModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Управление черными спискам</Text>
              <TouchableOpacity onPress={() => setIsBlacklistModalOpen(false)}>
                <Text style={styles.closeText}>Закрыть</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalScrollContent}>
              {blacklistSubscribersListQuery.error ? (
                <Text style={styles.errorText}>
                  {blacklistSubscribersListQuery.error.message}
                </Text>
              ) : null}
              {blacklistUsersListQuery.error ? (
                <Text style={styles.errorText}>
                  {blacklistUsersListQuery.error.message}
                </Text>
              ) : null}

              <Text style={styles.sectionTitle}>Длительность блокировки</Text>
              <View style={styles.durationRow}>
                {BLACKLIST_DURATION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setBlacklistDuration(option.value)}
                    style={[
                      styles.durationChip,
                      blacklistDuration === option.value
                        ? styles.durationChipActive
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        blacklistDuration === option.value
                          ? styles.durationChipTextActive
                          : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Подписчики сообщества</Text>

              <TextInput
                placeholder="Поиск по никнейму"
                placeholderTextColor={COLORS.white25}
                value={blacklistSearch}
                onChangeText={setBlacklistSearch}
                autoCapitalize="none"
                style={styles.searchInput}
              />

              {isBlacklistInitialLoading ? (
                <View style={styles.modalLoadingWrap}>
                  <ActivityIndicator color={COLORS.white85} />
                </View>
              ) : blacklistSubscribers.length === 0 ? (
                <Text style={styles.emptyText}>
                  {blacklistSearch.trim()
                    ? "Подписчики не найдены"
                    : "Нет подписчиков для блокировки"}
                </Text>
              ) : (
                <FlatList
                  data={blacklistSubscribers}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.virtualList}
                  onEndReachedThreshold={0.25}
                  onEndReached={() => {
                    if (
                      !blacklistSubscribersListQuery.hasNextPage ||
                      blacklistSubscribersListQuery.isFetchingNextPage
                    ) {
                      return;
                    }
                    void blacklistSubscribersListQuery.fetchNextPage();
                  }}
                  renderItem={({ item: subscriber }) => (
                    <View style={styles.userRow}>
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
                          setCommunityBlacklist.isPending &&
                          pendingBlacklistUserId === subscriber.id
                            ? "Сохраняем..."
                            : "В черный список"
                        }
                        onPress={() =>
                          handleToggleBlacklist(subscriber.id, true)
                        }
                        disabled={setCommunityBlacklist.isPending}
                        style={styles.inlineDangerButton}
                        TextStyle={styles.inlineDangerButtonText}
                      />
                    </View>
                  )}
                  ListFooterComponent={
                    blacklistSubscribersListQuery.isFetchingNextPage ? (
                      <View style={styles.listLoader}>
                        <ActivityIndicator color={COLORS.white85} />
                      </View>
                    ) : null
                  }
                />
              )}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>
                Пользователи в черном списке
              </Text>

              {isBlacklistInitialLoading ? (
                <View style={styles.modalLoadingWrap}>
                  <ActivityIndicator color={COLORS.white85} />
                </View>
              ) : blockedUsers.length === 0 ? (
                <Text style={styles.emptyText}>
                  {blacklistSearch.trim()
                    ? "Пользователи не найдены"
                    : "Черный список пуст"}
                </Text>
              ) : (
                <FlatList
                  data={blockedUsers}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.virtualList}
                  onEndReachedThreshold={0.25}
                  onEndReached={() => {
                    if (
                      !blacklistUsersListQuery.hasNextPage ||
                      blacklistUsersListQuery.isFetchingNextPage
                    ) {
                      return;
                    }
                    void blacklistUsersListQuery.fetchNextPage();
                  }}
                  renderItem={({ item: blockedUser }) => (
                    <View style={styles.userRow}>
                      <View style={styles.userInfoWrap}>
                        <Text style={styles.userName}>
                          @{blockedUser.nickname}
                        </Text>
                        <Text style={styles.userCaption}>
                          {blockedUser.name || "Без имени"}
                        </Text>
                        <Text style={styles.userCaption}>
                          {formatBlacklistExpiration(blockedUser.expiresAt)}
                        </Text>
                        <Text style={styles.userCaption}>
                          Добавил(а): @{blockedUser.blockedBy.nickname}
                        </Text>
                      </View>

                      <AppButton
                        title={
                          setCommunityBlacklist.isPending &&
                          pendingBlacklistUserId === blockedUser.id
                            ? "Сохраняем..."
                            : "Разблокировать"
                        }
                        onPress={() =>
                          handleToggleBlacklist(blockedUser.id, false)
                        }
                        disabled={setCommunityBlacklist.isPending}
                        style={styles.inlineActionButton}
                        TextStyle={styles.inlineActionButtonText}
                      />
                    </View>
                  )}
                  ListFooterComponent={
                    blacklistUsersListQuery.isFetchingNextPage ? (
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
      <Modal
        visible={isActionLogModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsActionLogModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>События сообщества</Text>
              <TouchableOpacity onPress={() => setIsActionLogModalOpen(false)}>
                <Text style={styles.closeText}>Закрыть</Text>
              </TouchableOpacity>
            </View>

            {actionLogQuery.error ? (
              <Text style={styles.errorText}>
                {actionLogQuery.error.message}
              </Text>
            ) : null}

            {isActionLogInitialLoading ? (
              <View style={styles.modalLoadingWrap}>
                <ActivityIndicator color={COLORS.white85} />
              </View>
            ) : actionLogs.length === 0 ? (
              <Text style={styles.emptyText}>Журнал действий пока пуст</Text>
            ) : (
              <FlatList
                data={actionLogs}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                onEndReachedThreshold={0.25}
                onEndReached={() => {
                  if (
                    !actionLogQuery.hasNextPage ||
                    actionLogQuery.isFetchingNextPage
                  ) {
                    return;
                  }
                  void actionLogQuery.fetchNextPage();
                }}
                renderItem={({ item: action }) => (
                  <View style={styles.logRow}>
                    <Text style={styles.logText}>{getActionText(action)}</Text>
                    <Text style={styles.logMeta}>
                      {new Date(action.createdAt).toLocaleString("ru-RU")}
                    </Text>
                  </View>
                )}
                ListFooterComponent={
                  actionLogQuery.isFetchingNextPage ? (
                    <View style={styles.listLoader}>
                      <ActivityIndicator color={COLORS.white85} />
                    </View>
                  ) : null
                }
              />
            )}
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

            <View style={styles.modalScrollContent}>
              <Text style={styles.warningText}>
                Выберите нового владельца. После передачи владения вы станете
                модератором.
              </Text>

              {transferModeratorsListQuery.error ? (
                <Text style={styles.errorText}>
                  {transferModeratorsListQuery.error.message}
                </Text>
              ) : null}
              {transferSubscribersListQuery.error ? (
                <Text style={styles.errorText}>
                  {transferSubscribersListQuery.error.message}
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

              {isTransferInitialLoading ? (
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
                <FlatList
                  data={transferModerators}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.virtualList}
                  onEndReachedThreshold={0.25}
                  onEndReached={() => {
                    if (
                      !transferModeratorsListQuery.hasNextPage ||
                      transferModeratorsListQuery.isFetchingNextPage
                    ) {
                      return;
                    }
                    void transferModeratorsListQuery.fetchNextPage();
                  }}
                  renderItem={({ item: moderator }) => (
                    <View style={styles.userRow}>
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
                  )}
                  ListFooterComponent={
                    transferModeratorsListQuery.isFetchingNextPage ? (
                      <View style={styles.listLoader}>
                        <ActivityIndicator color={COLORS.white85} />
                      </View>
                    ) : null
                  }
                />
              )}

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Подписчики сообщества</Text>

              {isTransferInitialLoading ? (
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
                <FlatList
                  data={transferSubscribers}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.virtualList}
                  onEndReachedThreshold={0.25}
                  onEndReached={() => {
                    if (
                      !transferSubscribersListQuery.hasNextPage ||
                      transferSubscribersListQuery.isFetchingNextPage
                    ) {
                      return;
                    }
                    void transferSubscribersListQuery.fetchNextPage();
                  }}
                  renderItem={({ item: subscriber }) => (
                    <View style={styles.userRow}>
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
                  )}
                  ListFooterComponent={
                    transferSubscribersListQuery.isFetchingNextPage ? (
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
      <StatusBar style="auto" />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    height: 40,
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
  durationChip: {
    backgroundColor: COLORS.postsCardBackground,
    borderColor: COLORS.white25,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  durationChipActive: {
    backgroundColor: COLORS.navBarBackground,
    borderColor: COLORS.white85,
  },
  durationChipText: {
    color: COLORS.white25,
    fontSize: 12,
    lineHeight: 18,
  },
  durationChipTextActive: {
    color: COLORS.white85,
  },
  durationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  listLoader: {
    paddingVertical: 10,
  },
  logMeta: {
    color: COLORS.white25,
    fontSize: 12,
    lineHeight: 18,
  },
  logRow: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 14,
    gap: 6,
    padding: 10,
  },
  logText: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  modalContent: {
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 24,
    maxHeight: "84%",
    maxWidth: SHELL_CONTENT_WIDTH,
    padding: 16,
    width: "100%",
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
    ...webInputFocusReset,
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
  virtualList: {
    maxHeight: 180,
  },
  warningText: {
    color: COLORS.white85,
    fontSize: 13,
    lineHeight: 19,
  },
});
