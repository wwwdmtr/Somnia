/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { isUserAdmin } from "@somnia/server/src/utils/can";
import { format } from "date-fns";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  FlatList,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ScreenName from "../../constants/ScreenName";
import { useAppContext } from "../../lib/ctx";
import { trpc } from "../../lib/trpc";
import { COLORS, typography } from "../../theme/typography";

import type { ProfileStackParamList } from "../../navigation/ProfileStackParamList";
import type { RootStackParamList } from "../../navigation/RootStackParamList";

type ProfileScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, ScreenName.Profile>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const ProfileScreen = () => {
  const { me, isLoading } = useAppContext();
  const utils = trpc.useUtils();
  const { data, error, refetch } = trpc.getMyPosts.useQuery({
    authorId: me.id || "",
  });
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [refreshing, setRefreshing] = useState(false);

  type MyPostsData = NonNullable<ReturnType<typeof utils.getMyPosts.getData>>;

  type LikeMutationContext = {
    previousData: MyPostsData | undefined;
  };

  const handleMutate = async (variables: {
    postId: string;
    isLikedByMe: boolean;
  }): Promise<LikeMutationContext> => {
    await utils.getMyPosts.cancel({ authorId: me.id || "" });
    const previousData = utils.getMyPosts.getData({ authorId: me.id || "" });

    utils.getMyPosts.setData({ authorId: me.id || "" }, (old) => {
      if (!old?.posts) {
        return old;
      }

      return {
        ...old,
        posts: old.posts.map((post) =>
          post.id === variables.postId
            ? {
                ...post,
                isLikedByMe: variables.isLikedByMe,
                likesCount: variables.isLikedByMe
                  ? post.likesCount + 1
                  : post.likesCount - 1,
              }
            : post,
        ),
      };
    });

    return { previousData };
  };

  const handleError = (
    _err: unknown,
    _variables: unknown,
    context: LikeMutationContext | undefined,
  ) => {
    if (context?.previousData) {
      utils.getMyPosts.setData({ authorId: me.id || "" }, context.previousData);
    }
  };

  const handleSuccess = (data: {
    post: { id: string; likesCount: number; isLikedByMe: boolean };
  }) => {
    utils.getMyPosts.setData({ authorId: me.id || "" }, (old) => {
      if (!old?.posts) {
        return old;
      }

      return {
        ...old,
        posts: old.posts.map((post) =>
          post.id === data.post.id
            ? {
                ...post,
                isLikedByMe: data.post.isLikedByMe,
                likesCount: data.post.likesCount,
              }
            : post,
        ),
      };
    });
  };

  const setPostLike = trpc.setPostLike.useMutation({
    onMutate: handleMutate,
    onError: handleError,
    onSuccess: handleSuccess,
  });

  const toggleLike = (postId: string, currentLikeState: boolean) => {
    setPostLike.mutate({
      postId,
      isLikedByMe: !currentLikeState,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenPost = (id: string) => {
    navigation.navigate("Post", { id });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text>Error: {error?.message ?? "Unknown error"}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Image
        source={require("../../assets/defaults/user-avatar.png")}
        style={styles.avatar}
      ></Image>
      {me.name ? <Text style={typography.h3_white85}>{me.name}</Text> : null}

      <View style={styles.header_user_name}>
        <Text style={typography.body_white85}>@{me.nickname}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate(ScreenName.UpdateProfile)}
        >
          <Image
            source={require("../../assets/Icons/decorIcons/edit-outline.png")}
            style={styles.edit_user_name}
          ></Image>
        </TouchableOpacity>
      </View>

      <View style={styles.game_info_bar_wrapper}>
        <View style={styles.game_dreams}>
          <Text style={typography.h3_white85}>324</Text>
          <Text style={typography.body_white85}>сон</Text>
        </View>
        <View style={styles.game_dreams}>
          <Text style={typography.h3_white85}>125</Text>
          <Text style={typography.body_white85}>орбит</Text>
        </View>
        <View style={styles.game_dreams}>
          <Text style={typography.h3_white85}>107</Text>
          <Text style={typography.body_white85}>спутник</Text>
        </View>
      </View>

      {isUserAdmin(me) ? (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(ScreenName.AdminStack, {
              screen: ScreenName.AdminHome,
            })
          }
        >
          <Text style={typography.body_white85}>Админка</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const renderItem = ({
    item: post,
  }: {
    item: (typeof data.posts)[number];
  }) => (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <Text style={typography.additionalInfo_white25}>
          {format(new Date(post.createdAt), "dd.MM.yyyy")}
        </Text>
      </View>

      <View style={styles.dream_info}>
        <Text style={typography.h4_white_85}>{post.title}</Text>

        <Text style={typography.body_white100} numberOfLines={3}>
          {post.text}...
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => handleOpenPost(post.id)}
        style={styles.read_more}
      >
        <Text style={typography.caption_link}>Читать далее...</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <View style={styles.action}>
          <TouchableOpacity
            onPress={() => toggleLike(post.id, post.isLikedByMe)}
          >
            <Ionicons
              name={post.isLikedByMe ? "star" : "star-outline"}
              size={20}
              color={post.isLikedByMe ? "red" : "rgba(255,255,255, 0.45)"}
            />
          </TouchableOpacity>
          <Text style={typography.caption_white85}>
            {post.likesCount} нравится
          </Text>
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
  );

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={data.posts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
            />
          }
        ></FlatList>
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
  avatar: {
    height: 100,
    width: 100,
  },
  card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    marginBottom: 8,
    padding: 20,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  dream_info: {
    gap: 12,
  },
  edit_user_name: {
    height: 24,
    width: 24,
  },
  game_dreams: {
    alignItems: "center",
    flexDirection: "column",
    height: 60,
    justifyContent: "space-between",
  },
  game_info_bar_wrapper: {
    flexDirection: "row",
    gap: 16,
    height: 60,
    justifyContent: "space-between",
    marginHorizontal: 220,
    marginTop: 20,
    paddingHorizontal: 24,
    width: 321,
  },
  header: {
    alignItems: "center",
    gap: 20,
    marginVertical: 44,
  },

  header_user_name: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },

  listContent: {
    paddingBottom: 70,
  },

  postHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,

    marginBottom: 24,
    width: "100%",
  },

  read_more: {
    marginTop: 8,
  },
  safeArea: {
    flex: 1,
    marginBottom: 20,
    marginHorizontal: 14,
  },
});
