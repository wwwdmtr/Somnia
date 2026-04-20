/* eslint-disable @typescript-eslint/no-require-imports */
// src/screens/EditPostScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import {
  Alert,
  ImageBackground,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { UpdatePostForms } from "../../components/forms/UpdatePostForm";
import ScreenName from "../../constants/ScreenName";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { AddPostStackParamList } from "../../navigation/AddPostStackParamList";
import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = FeedStackParamList & AddPostStackParamList;

type EditPostRouteProp = RouteProp<RootStackParamList, ScreenName.EditPost>;
type EditPostNavProp = NativeStackNavigationProp<
  RootStackParamList,
  ScreenName.EditPost
>;

export const UpdatePostScreen = () => {
  const route = useRoute<EditPostRouteProp>();
  const navigation = useNavigation<EditPostNavProp>();
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.getPost.useQuery({
    id: String(route.params.id),
  });
  const deletePost = trpc.deletePost.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.getPosts.invalidate(),
        utils.getMyPosts.invalidate(),
        utils.getUserPosts.invalidate(),
        utils.getRatedPosts.invalidate(),
        utils.getDeletedPosts.invalidate(),
      ]);
      navigation.popToTop();
    },
  });

  const executeDeletePost = async () => {
    if (!data?.post) {
      return;
    }

    try {
      await deletePost.mutateAsync({ postId: String(data.post.id) });
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error ? error.message : "Не удалось удалить пост",
      );
    }
  };

  const handleDeletePost = () => {
    if (!data?.post) {
      return;
    }
    if (!data.post.canDeleteByMe) {
      Alert.alert("Нет прав", "Вы не можете удалить этот пост.");
      return;
    }

    if (Platform.OS === "web") {
      const shouldDelete =
        typeof window !== "undefined"
          ? window.confirm(
              "Удалить пост? Пост будет скрыт и исчезнет из ленты.",
            )
          : true;
      if (!shouldDelete) {
        return;
      }
      void executeDeletePost();
      return;
    }

    Alert.alert(
      "Удалить пост?",
      "Пост будет скрыт и исчезнет из ленты.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            void executeDeletePost();
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <Text>Loading...</Text>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.container}>
        <Text>Error: {error.message}</Text>
      </ScrollView>
    );
  }

  if (!data?.post) {
    return (
      <ScrollView style={styles.container}>
        <Text>Dream not found</Text>
      </ScrollView>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
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
            <Pressable
              onPress={handleDeletePost}
              disabled={deletePost.isPending}
              style={styles.actionButton}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={
                  data.post.canDeleteByMe ? COLORS.white85 : COLORS.white25
                }
              />
            </Pressable>
          </View>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
          >
            <Text style={typography.h2_white100}>Изменение поста</Text>
            <View style={styles.form_container}>
              <UpdatePostForms
                post={data.post}
                onSuccess={() => navigation.popToTop()}
              />
            </View>
          </ScrollView>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  actionButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
  },
  content: {
    paddingBottom: 32,
  },
  form_container: {
    marginTop: 24,
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
    marginBottom: 14,
    marginHorizontal: 14,
    marginTop: 14,
    paddingHorizontal: 16,
  },
  safeArea: {
    flex: 1,
  },
});
