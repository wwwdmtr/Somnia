/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AddCommunityPostForm } from "../../components/forms/AddCommunityPostForm";
import { AddPostForm } from "../../components/forms/AddPostForm";
import { CreateCommunityForm } from "../../components/forms/CreateCommunityForm";
import { AppScreen } from "../../components/layout/AppScreen";
import { GuestModeNotice } from "../../components/ui/GuestModeNotice";
import { SHELL_CONTENT_WIDTH } from "../../constants/layout";
import { useFeedbackOnError } from "../../lib/appFeedback";
import { getAvatarSource } from "../../lib/avatar";
import { useMe } from "../../lib/ctx";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { AddPostStackParamList } from "../../navigation/AddPostStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type AddPostNavProp = NativeStackNavigationProp<
  AddPostStackParamList,
  "AddPost"
>;

type PublisherSelection =
  | {
      type: "user";
    }
  | {
      communityId: string;
      type: "community";
    };

type CreationTarget = "post" | "community" | "event";
type ManagedCommunity = {
  avatar: string | null;
  id: string;
  name: string;
  role: "OWNER" | "MODERATOR";
};
type SelectedCommunity = Pick<ManagedCommunity, "avatar" | "id" | "name">;

const EMPTY_COMMUNITIES: ManagedCommunity[] = [];
const CREATION_TARGET_LABELS: Record<CreationTarget, string> = {
  post: "Пост",
  community: "Сообщество",
  event: "Событие",
};
const CREATION_TARGETS: CreationTarget[] = ["post", "community", "event"];
const MODAL_OVERLAY_BACKGROUND = COLORS.modalOverlay;

export const AddPostScreen = () => {
  const navigation = useNavigation<AddPostNavProp>();
  const me = useMe();
  const [isPublisherPickerOpen, setIsPublisherPickerOpen] = useState(false);
  const [selectedCreationTarget, setSelectedCreationTarget] =
    useState<CreationTarget>("post");
  const [selectedPublisher, setSelectedPublisher] =
    useState<PublisherSelection>({
      type: "user",
    });
  const [recentlyCreatedCommunity, setRecentlyCreatedCommunity] =
    useState<SelectedCommunity | null>(null);

  const { data, isLoading, error, refetch } =
    trpc.getMyPublishingIdentities.useQuery(undefined, {
      enabled: Boolean(me?.id),
    });
  useFeedbackOnError(error, "Ошибка загрузки профилей публикации");

  const managedCommunities = data?.communities ?? EMPTY_COMMUNITIES;
  const selectedCommunity = useMemo(() => {
    if (selectedPublisher.type !== "community") {
      return null;
    }

    return (
      managedCommunities.find(
        (community) => community.id === selectedPublisher.communityId,
      ) ??
      (recentlyCreatedCommunity?.id === selectedPublisher.communityId
        ? recentlyCreatedCommunity
        : null)
    );
  }, [managedCommunities, recentlyCreatedCommunity, selectedPublisher]);

  const actorName =
    data?.me.name?.trim() ||
    (data?.me.nickname
      ? `@${data.me.nickname}`
      : me?.nickname
        ? `@${me.nickname}`
        : "Пользователь");

  const currentPublisherLabel =
    selectedPublisher.type === "community" && selectedCommunity
      ? selectedCommunity.name
      : data?.me.nickname || me?.nickname
        ? `@${data?.me.nickname ?? me?.nickname}`
        : "Личный профиль";

  const currentPublisherAvatar =
    selectedPublisher.type === "community" && selectedCommunity
      ? selectedCommunity.avatar
      : (data?.me.avatar ?? me?.avatar);
  const currentPublisherCaption =
    selectedPublisher.type === "community" ? "Сообщество" : "Ваш профиль";

  if (!me?.id) {
    return (
      <AppScreen contentStyle={styles.guestContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
            <Text style={typography.body_white85}>Назад</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.creationHeader}>
          <Text style={[typography.h2_white85, styles.screenTitle]}>
            Создание
          </Text>
        </View>

        <View style={styles.guestNoticeWrapper}>
          <GuestModeNotice
            message="Создание постов и сообществ доступно после входа."
            title="Публикация закрыта"
          />
        </View>
      </AppScreen>
    );
  }

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

      <View style={styles.creationHeader}>
        <Text style={[typography.h2_white85, styles.screenTitle]}>
          Создание
        </Text>

        <View style={styles.creationTabsRow}>
          {CREATION_TARGETS.map((target) => {
            const isActive = selectedCreationTarget === target;

            return (
              <TouchableOpacity
                key={target}
                style={styles.creationTab}
                onPress={() => setSelectedCreationTarget(target)}
              >
                <Text
                  style={
                    isActive
                      ? styles.creationTabTextActive
                      : styles.creationTabText
                  }
                >
                  {CREATION_TARGET_LABELS[target]}
                </Text>
                <View
                  style={[
                    styles.creationTabIndicator,
                    isActive && styles.creationTabIndicatorActive,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedCreationTarget === "post" ? (
        <View style={styles.publisherBlock}>
          <Text style={styles.publisherLabel}>Куда опубликовать</Text>
          <TouchableOpacity
            style={styles.publisherSwitch}
            onPress={() => setIsPublisherPickerOpen(true)}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white85} size="small" />
            ) : (
              <>
                <Image
                  source={getAvatarSource(currentPublisherAvatar, "small")}
                  style={styles.publisherAvatar}
                />
                <View style={styles.publisherTextWrap}>
                  <Text style={styles.publisherText} numberOfLines={1}>
                    {currentPublisherLabel}
                  </Text>
                  <Text style={styles.publisherCaption} numberOfLines={1}>
                    {currentPublisherCaption}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={COLORS.white85}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {selectedCreationTarget === "community" ? (
          <CreateCommunityForm
            onCreated={(community) => {
              setRecentlyCreatedCommunity(community);
              setSelectedCreationTarget("post");
              setSelectedPublisher({
                type: "community",
                communityId: community.id,
              });
              void refetch();
            }}
          />
        ) : selectedCreationTarget === "event" ? (
          <View style={styles.eventPlaceholder}>
            <Ionicons
              name="calendar-outline"
              size={28}
              color={COLORS.white85}
            />
            <Text style={styles.eventPlaceholderTitle}>События</Text>
            <Text style={styles.eventPlaceholderText}>
              Создание событий появится позже.
            </Text>
          </View>
        ) : selectedPublisher.type === "community" && selectedCommunity ? (
          <AddCommunityPostForm
            communityId={selectedCommunity.id}
            communityName={selectedCommunity.name}
            publisherName={actorName}
          />
        ) : (
          <AddPostForm />
        )}
      </ScrollView>

      <Modal
        visible={isPublisherPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPublisherPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPublisherPickerOpen(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Публикация от лица</Text>

            <TouchableOpacity
              style={styles.publisherOption}
              onPress={() => {
                setSelectedPublisher({ type: "user" });
                setIsPublisherPickerOpen(false);
              }}
            >
              <Image
                source={getAvatarSource(data?.me.avatar ?? me?.avatar, "small")}
                style={styles.optionAvatar}
              />
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle} numberOfLines={1}>
                  {data?.me.nickname || me?.nickname
                    ? `@${data?.me.nickname ?? me?.nickname}`
                    : "Личный профиль"}
                </Text>
                <Text style={styles.optionCaption}>Ваш профиль</Text>
              </View>
              {selectedPublisher.type === "user" ? (
                <Ionicons name="checkmark" size={18} color={COLORS.white85} />
              ) : null}
            </TouchableOpacity>

            {managedCommunities.map((community) => {
              const isSelected =
                selectedPublisher.type === "community" &&
                selectedPublisher.communityId === community.id;

              return (
                <TouchableOpacity
                  key={community.id}
                  style={styles.publisherOption}
                  onPress={() => {
                    setSelectedPublisher({
                      type: "community",
                      communityId: community.id,
                    });
                    setIsPublisherPickerOpen(false);
                  }}
                >
                  <Image
                    source={getAvatarSource(community.avatar, "small")}
                    style={styles.optionAvatar}
                  />
                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionTitle} numberOfLines={1}>
                      {community.name}
                    </Text>
                    <Text style={styles.optionCaption}>
                      {community.role === "OWNER" ? "Владелец" : "Модератор"}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={COLORS.white85}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {error ? (
              <Text style={styles.errorText}>{error.message}</Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>
      <StatusBar style="auto" />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
  },
  creationHeader: {
    gap: 14,
    marginBottom: 18,
    marginTop: 30,
  },
  creationTab: {
    alignItems: "center",
    flex: 1,
    gap: 6,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  creationTabIndicator: {
    backgroundColor: COLORS.transparent,
    borderRadius: 999,
    height: 3,
    width: "100%",
  },
  creationTabIndicatorActive: {
    backgroundColor: COLORS.brandBlueLight,
  },
  creationTabText: {
    color: COLORS.white25,
    fontSize: 16,
    lineHeight: 24,
  },
  creationTabTextActive: {
    color: COLORS.white85,
    fontSize: 16,
    lineHeight: 24,
  },
  creationTabsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  errorText: {
    color: COLORS.white85,
    fontSize: 12,
    marginTop: 6,
  },
  eventPlaceholder: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 24,
    gap: 8,
    marginTop: 28,
    padding: 24,
  },
  eventPlaceholderText: {
    color: COLORS.white25,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  eventPlaceholderTitle: {
    color: COLORS.white85,
    fontSize: 20,
    lineHeight: 28,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingBottom: 24,
  },
  goBackWrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  guestContainer: {
    flex: 1,
    padding: 14,
  },
  guestNoticeWrapper: {
    flex: 1,
    justifyContent: "center",
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
  modalContent: {
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 24,
    gap: 8,
    maxWidth: SHELL_CONTENT_WIDTH,
    padding: 16,
    width: "100%",
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
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  optionAvatar: {
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  optionCaption: {
    color: COLORS.white25,
    fontSize: 12,
    lineHeight: 18,
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  publisherAvatar: {
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  publisherBlock: {
    gap: 8,
    marginBottom: 10,
  },
  publisherCaption: {
    color: COLORS.white25,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  publisherLabel: {
    color: COLORS.white85,
    fontSize: 16,
    lineHeight: 24,
  },
  publisherOption: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  publisherSwitch: {
    alignItems: "center",
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 20,
    flexDirection: "row",
    gap: 8,
    minHeight: 58,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: "100%",
  },
  publisherText: {
    color: COLORS.white85,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  publisherTextWrap: {
    flexShrink: 1,
    gap: 1,
    minWidth: 0,
  },
  screenTitle: {
    flexShrink: 1,
    minWidth: 0,
  },
});
