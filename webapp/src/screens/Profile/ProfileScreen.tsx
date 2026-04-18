/* eslint-disable @typescript-eslint/no-require-imports */
import {
  CompositeNavigationProp,
  useNavigation,
} from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { isUserAdmin } from "@somnia/shared/src/utils/can";
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

import { PostCard } from "../../components/post/PostCard";
import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import ScreenName from "../../constants/ScreenName";
import { getAvatarSource } from "../../lib/avatar";
import { useAppContext } from "../../lib/ctx";
import {
  applyOptimisticLikeToPosts,
  applyServerLikeToPosts,
  usePostLikeMutation,
} from "../../lib/postLikeMutation";
import { trpc } from "../../lib/trpc";
import { typography } from "../../theme/typography";

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
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
  }>({
    isOpen: false,
    images: [],
    index: 0,
  });

  type MyPostsData = NonNullable<ReturnType<typeof utils.getMyPosts.getData>>;

  const setPostLike = usePostLikeMutation<MyPostsData>({
    applyOptimistic: (old, variables) => {
      if (!old?.posts) {
        return old;
      }

      return {
        ...old,
        posts: applyOptimisticLikeToPosts(old.posts, variables),
      };
    },
    applyServer: (old, likeData) => {
      if (!old?.posts) {
        return old;
      }

      return {
        ...old,
        posts: applyServerLikeToPosts(old.posts, likeData),
      };
    },
    cancel: () => utils.getMyPosts.cancel({ authorId: me.id || "" }),
    getData: () => utils.getMyPosts.getData({ authorId: me.id || "" }),
    setData: (updater) =>
      utils.getMyPosts.setData({ authorId: me.id || "" }, updater),
  });

  const toggleLike = (postId: string, currentLikeState: boolean) => {
    setPostLike.mutate({
      postId,
      isLikedByMe: !currentLikeState,
    });
  };

  const openImageViewer = (images: string[], index: number) => {
    setImageViewerState({
      isOpen: true,
      images,
      index,
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
        source={getAvatarSource(me.avatar, "big")}
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
  }) => {
    return (
      <PostCard
        post={post}
        contentOrder="textFirst"
        imageHeight={180}
        onOpenPost={handleOpenPost}
        onToggleLike={toggleLike}
        onOpenImageViewer={openImageViewer}
        openPostOnTextPress={false}
        showAuthor={false}
      />
    );
  };

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
        <PostImageViewerModal
          visible={imageViewerState.isOpen}
          imagePublicIds={imageViewerState.images}
          initialIndex={imageViewerState.index}
          onClose={() =>
            setImageViewerState((prev) => ({ ...prev, isOpen: false }))
          }
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  avatar: {
    borderRadius: 50,
    height: 100,
    width: 100,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
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

  safeArea: {
    flex: 1,
    marginBottom: 20,
    marginHorizontal: 14,
  },
});
