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

import type { AddDreamStackParamList } from "../../navigation/AddDreamStackParamList";
import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type DreamScreenRouteProp = RouteProp<
  FeedStackParamList & AddDreamStackParamList,
  ScreenName.Dream
>;
type DreamScreenStackParamList = FeedStackParamList & AddDreamStackParamList;
type DreamScreenNavProp = NativeStackNavigationProp<
  DreamScreenStackParamList,
  ScreenName.Dream
>;

export const DreamScreen = () => {
  const route = useRoute<DreamScreenRouteProp>();
  const navigation = useNavigation<DreamScreenNavProp>();
  const { data, isLoading, error } = trpc.getDream.useQuery({
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

  if (!data.dream) {
    return <ScrollView style={styles.container}></ScrollView>;
  }

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image
              source={require("../../assets/Icons/navIcons/goBack.png")}
            ></Image>
            <Text style={typography.body_white85}>Назад</Text>
          </TouchableOpacity>
          {me?.id === data.dream.author.id ? (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(ScreenName.EditDream, {
                  id: String(data.dream.id),
                })
              }
            >
              <Ionicons name="create-outline" size={24} color="white" />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.card}>
          <View style={styles.postHeader}>
            <Image
              source={require("../../assets/defaults/user-avatar.png")}
              style={styles.cardImage}
            />
            <View style={styles.postHeaderInfo}>
              <Text style={typography.body_white85}>
                @{data.dream.author.nickname}
              </Text>
              <Text style={typography.additionalInfo_white25}>
                {format(new Date(data.dream.createdAt), "dd.MM.yyyy")}
              </Text>
            </View>
          </View>

          <View style={styles.dream_info}>
            <Text style={typography.h3_white_85}>{data.dream.title}</Text>

            <Text style={typography.body_white100}>{data.dream.text}</Text>
          </View>
          <View style={styles.actions}>
            <View style={styles.action}>
              <TouchableOpacity onPress={() => setLike(!isLikeSet)}>
                {isLikeSet ? (
                  <Ionicons name="star" size={20} color="red" />
                ) : (
                  <Ionicons
                    name="star-outline"
                    size={20}
                    color="rgba(255,255,255, 0.45)"
                  />
                )}
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
      </SafeAreaView>
      <View style={styles.comment_interraction}>
        <View style={styles.comment_input}>
          <TextInput
            // eslint-disable-next-line react-native/no-inline-styles
            style={[typography.body_white25, { padding: 0 }]}
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
});

{
  /* <Text style={styles.description}>Dream id: {data.dream.id}</Text>
      <Text style={styles.description}>By: {data.dream.author.nickname}</Text>
      <Text style={styles.description}>{data.dream.title}</Text>
      <Text style={styles.description}>{data.dream.description}</Text>
      <Text style={styles.description}>{data.dream.text}</Text>
      <Text style={styles.description}>
        Created At: {format(new Date(data.dream.createdAt), 'dd-MM-yyyy HH:mm')}
      </Text>
      {me?.id === data.dream.author.id ? (
        <Button
          title="Edit dream"
          onPress={() =>
            navigation.navigate(ScreenName.EditDream, {
              id: String(data.dream.id),
            })
          }
        />
      ) : null} */
}
