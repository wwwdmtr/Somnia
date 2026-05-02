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
import { SHELL_CONTENT_WIDTH } from "../../constants/layout";
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

type ComposerMode = "post" | "createCommunity";
const EMPTY_COMMUNITIES: Array<{
  avatar: string | null;
  id: string;
  name: string;
  role: "OWNER" | "MODERATOR";
}> = [];
const MODAL_OVERLAY_BACKGROUND = COLORS.modalOverlay;

export const AddPostScreen = () => {
  const navigation = useNavigation<AddPostNavProp>();
  const me = useMe();
  const [isPublisherPickerOpen, setIsPublisherPickerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<ComposerMode>("post");
  const [selectedPublisher, setSelectedPublisher] =
    useState<PublisherSelection>({
      type: "user",
    });

  const { data, isLoading, error, refetch } =
    trpc.getMyPublishingIdentities.useQuery();

  const managedCommunities = data?.communities ?? EMPTY_COMMUNITIES;
  const selectedCommunity = useMemo(() => {
    if (selectedPublisher.type !== "community") {
      return null;
    }

    return (
      managedCommunities.find(
        (community) => community.id === selectedPublisher.communityId,
      ) ?? null
    );
  }, [managedCommunities, selectedPublisher]);

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
  const screenTitle = useMemo(() => {
    if (composerMode === "createCommunity") {
      return "Создание сообщества";
    }

    if (selectedPublisher.type === "community" && selectedCommunity) {
      return "Пост в сообщество";
    }

    return "Новый пост";
  }, [composerMode, selectedPublisher.type, selectedCommunity]);

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

      <View style={styles.addDreamHeader}>
        <Text style={typography.h2_white85}>{screenTitle}</Text>

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
              <Text style={styles.publisherText} numberOfLines={1}>
                {currentPublisherLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.white85} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {composerMode === "createCommunity" ? (
          <CreateCommunityForm
            onCancel={() => setComposerMode("post")}
            onCreated={(community) => {
              setComposerMode("post");
              setSelectedPublisher({
                type: "community",
                communityId: community.id,
              });
              void refetch();
            }}
          />
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
                setComposerMode("post");
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
                    setComposerMode("post");
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

            <TouchableOpacity
              style={styles.createCommunityOption}
              onPress={() => {
                setComposerMode("createCommunity");
                setIsPublisherPickerOpen(false);
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={COLORS.white85}
              />
              <Text style={styles.createCommunityText}>Создать сообщество</Text>
            </TouchableOpacity>

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
  addDreamHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  container: {
    flex: 1,
    padding: 14,
  },
  createCommunityOption: {
    alignItems: "center",
    borderColor: COLORS.white25,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  createCommunityText: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: COLORS.white85,
    fontSize: 12,
    marginTop: 6,
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
    borderRadius: 99,
    flexDirection: "row",
    gap: 8,
    maxWidth: "62%",
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  publisherText: {
    color: COLORS.white85,
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
