/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { format } from "date-fns/format";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  StyleSheet,
  Text,
  ScrollView,
  ImageBackground,
  View,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenName from "../../constants/ScreenName";
import { useMe } from "../../lib/ctx";
import { trpc } from "../../lib/trpc";
import { typography, COLORS } from "../../theme/typography";

import type { AddPostStackParamList } from "../../navigation/AddPostStackParamList";
import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type PostScreenRouteProp = RouteProp<
  FeedStackParamList & AddPostStackParamList,
  ScreenName.Post
>;
type PostScreenStackParamList = FeedStackParamList & AddPostStackParamList;
type PostScreenNavProp = NativeStackNavigationProp<
  PostScreenStackParamList,
  ScreenName.Post
>;

export const PostScreen = () => {
  const route = useRoute<PostScreenRouteProp>();
  const navigation = useNavigation<PostScreenNavProp>();
  const { data, isLoading, error } = trpc.getPost.useQuery({
    id: route.params.id,
  });
  const me = useMe();
  const [isLikeSet, setLike] = useState(false);

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.container}>
        <Text>Error: {error.message}</Text>
        <StatusBar style="auto" />
      </ScrollView>
    );
  }

  if (!data.post) {
    return <ScrollView style={styles.container}></ScrollView>;
  }

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* HEADER */}
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

              {me?.id === data.post.author.id && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(ScreenName.EditPost, {
                      id: String(data.post.id),
                    })
                  }
                >
                  <Ionicons name="create-outline" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {/* CARD */}
            <View style={styles.card}>
              <View style={styles.postHeader}>
                <Image
                  source={require("../../assets/defaults/user-avatar.png")}
                  style={styles.cardImage}
                />
                <View style={styles.postHeaderInfo}>
                  <Text style={typography.body_white85}>
                    @{data.post.author.nickname}
                  </Text>
                  <Text style={typography.additionalInfo_white25}>
                    {format(new Date(data.post.createdAt), "dd.MM.yyyy")}
                  </Text>
                </View>
              </View>

              <View style={styles.dream_info}>
                <Text style={typography.h4_white_85}>{data.post.title}</Text>
                <Text style={typography.body_white100}>{data.post.text}</Text>
              </View>

              <View style={styles.actions}>
                <View style={styles.action}>
                  <TouchableOpacity onPress={() => setLike(!isLikeSet)}>
                    <Ionicons
                      name={isLikeSet ? "star" : "star-outline"}
                      size={20}
                      color={isLikeSet ? "red" : "rgba(255,255,255,0.45)"}
                    />
                  </TouchableOpacity>
                  <Text style={typography.caption_white85}>нравится</Text>
                </View>

                <View style={styles.action}>
                  <Image
                    source={require("../../assets/Icons/Activity/comments.png")}
                    style={styles.action_img}
                  />
                  <Text style={typography.caption_white85}>комментариев</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* FIXED COMMENT INPUT */}
        <View style={styles.comment_interraction}>
          <View style={styles.comment_input}>
            <TextInput
              style={typography.body_white25}
              placeholder="Написать комментарий ..."
              placeholderTextColor="rgba(255,255,255,0.25)"
              multiline
            />
          </View>
          <TouchableOpacity style={styles.comment_send_button_wrapper}>
            <Image
              source={require("../../assets/Icons/formIcons/send_comment.png")}
              style={styles.comment_send_button}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  action: {
    flexDirection: "row",
    gap: 7,
  },
  action_img: {
    height: 24,
    width: 24,
  },
  actions: {
    flexDirection: "row",
    height: 22,
    justifyContent: "space-between",
    marginTop: 24,
    width: 277,
  },
  card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    marginBottom: 8,
    padding: 20,
  },
  cardImage: {
    height: 48,
    width: 48,
  },
  comment_input: {
    borderColor: COLORS.white25,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    marginLeft: 10,
    paddingLeft: 11,
    width: 291,
  },
  comment_interraction: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 999,
    borderTopWidth: 0,
    bottom: 28,
    elevation: 0,
    flexDirection: "row",
    height: 60,
    justifyContent: "space-between",
    left: 13,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    position: "absolute",
    right: 13,
    shadowOpacity: 0,
  },
  comment_send_button: {
    height: 24,
    width: 24,
  },
  comment_send_button_wrapper: {
    marginRight: 20,
  },
  container: {
    flex: 1,
    padding: 14,
  },
  dream_info: {
    gap: 12,
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
  postHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    height: 48,
    marginBottom: 24,
    width: "100%",
  },
  postHeaderInfo: {
    flexDirection: "column",
    gap: 4,
    justifyContent: "space-between",
  },
  scrollContent: {
    paddingBottom: 100,
  },
});
