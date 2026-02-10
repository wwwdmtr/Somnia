/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  RouteProp,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { canDeletePost, isUserAdmin } from "@somnia/server/src/utils/can";
import { format } from "date-fns/format";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  ImageBackground,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddCommentForm } from "../../components/forms/AddCommentForm";
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

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    nickname: string;
    name: string;
  };
  repliesCount: number;
  replies: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: {
      id: string;
      nickname: string;
      name: string;
    };
  }>;
};

export const PostScreen = () => {
  const route = useRoute<PostScreenRouteProp>();
  const navigation = useNavigation<PostScreenNavProp>();
  const utils = trpc.useUtils();
  const me = useMe();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [replyingTo, setReplyingTo] = useState<{
    commentId: string;
    nickname: string;
  } | null>(null);
  const deletePost = trpc.deletePost.useMutation();
  const undoDeletePost = trpc.undoDeletePost.useMutation();

  type PostData = NonNullable<ReturnType<typeof utils.getPost.getData>>;

  type LikeMutationContext = {
    previousData: PostData | undefined;
  };

  const { data, isLoading, error } = trpc.getPost.useQuery({
    id: route.params.id,
  });

  const {
    data: commentsData,
    isLoading: commentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.getCommentsByPost.useInfiniteQuery(
    {
      postId: route.params.id,
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const comments = commentsData?.pages.flatMap((page) => page.comments) ?? [];
  const totalCommentsCount = comments.length;

  useFocusEffect(
    useCallback(() => {
      return () => {
        utils.getPosts.invalidate();
      };
    }, [utils]),
  );

  const toggleCommentExpand = useCallback((commentId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  }, []);

  const handleReplyToComment = useCallback(
    (
      commentId: string,
      nickname: string,
      isReply?: boolean,
      parentCommentId?: string,
    ) => {
      setReplyingTo({
        commentId: isReply && parentCommentId ? parentCommentId : commentId,
        nickname,
      });
      setExpandedComments((prev) => {
        const newSet = new Set(prev);
        newSet.add(isReply && parentCommentId ? parentCommentId : commentId);
        return newSet;
      });
    },
    [],
  );

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleCommentSuccess = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleMutate = async (variables: {
    postId: string;
    isLikedByMe: boolean;
  }): Promise<LikeMutationContext> => {
    await utils.getPost.cancel({ id: route.params.id });
    const previousData = utils.getPost.getData({ id: route.params.id });

    utils.getPost.setData({ id: route.params.id }, (old) => {
      if (!old?.post) {
        return old;
      }

      return {
        ...old,
        post: {
          ...old.post,
          isLikedByMe: variables.isLikedByMe,
          likesCount: variables.isLikedByMe
            ? old.post.likesCount + 1
            : old.post.likesCount - 1,
        },
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
      utils.getPost.setData({ id: route.params.id }, context.previousData);
    }
  };

  const handleSuccess = (data: {
    post: { id: string; likesCount: number; isLikedByMe: boolean };
  }) => {
    utils.getPost.setData({ id: route.params.id }, (old) => {
      if (!old?.post) {
        return old;
      }

      return {
        ...old,
        post: {
          ...old.post,
          isLikedByMe: data.post.isLikedByMe,
          likesCount: data.post.likesCount,
        },
      };
    });
  };

  const setPostLike = trpc.setPostLike.useMutation({
    onMutate: handleMutate,
    onError: handleError,
    onSuccess: handleSuccess,
  });

  const deleteComment = trpc.deleteComment.useMutation({
    onSuccess: () => {
      utils.getCommentsByPost.invalidate({ postId: route.params.id });
    },
  });

  const toggleLike = useCallback(() => {
    if (!data?.post) {
      return;
    }

    setPostLike.mutate({
      postId: data.post.id,
      isLikedByMe: !data.post.isLikedByMe,
    });
  }, [data, setPostLike]);

  const loadMoreComments = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderComment = useCallback(
    ({ item: comment }: { item: Comment }) => {
      const isExpanded = expandedComments.has(comment.id);
      const hasReplies = comment.repliesCount > 0;

      return (
        <View style={styles.commentWrapper}>
          <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Image
                source={require("../../assets/defaults/user-avatar.png")}
                style={styles.commentAvatar}
              />
              <View style={styles.commentHeaderInfo}>
                <Text style={typography.body_white85}>
                  @{comment.author.nickname}
                </Text>
                <Text style={typography.additionalInfo_white25}>
                  {format(new Date(comment.createdAt), "dd.MM.yyyy HH:mm")}
                </Text>
              </View>
              {me?.id === comment.author.id && (
                <TouchableOpacity
                  onPress={() => {
                    deleteComment.mutate({ commentId: comment.id });
                  }}
                >
                  <Ionicons name="trash-outline" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[typography.body_white100, styles.commentContent]}>
              {comment.content}
            </Text>

            <View style={styles.commentActions}>
              <TouchableOpacity
                onPress={() =>
                  handleReplyToComment(comment.id, comment.author.nickname)
                }
                style={styles.replyButton}
              >
                <Ionicons
                  name="arrow-undo-outline"
                  size={16}
                  color={COLORS.white85}
                />
                <Text style={typography.caption_white85}>Ответить</Text>
              </TouchableOpacity>

              {hasReplies && (
                <TouchableOpacity
                  onPress={() => toggleCommentExpand(comment.id)}
                  style={styles.repliesToggle}
                >
                  <Text style={typography.caption_white85}>
                    {isExpanded ? "▼" : "▶"} {comment.repliesCount}{" "}
                    {comment.repliesCount === 1 ? "ответ" : "ответов"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {isExpanded &&
            comment.replies.map((reply) => (
              <View key={reply.id} style={styles.replyCard}>
                <View style={styles.commentHeader}>
                  <Image
                    source={require("../../assets/defaults/user-avatar.png")}
                    style={styles.replyAvatar}
                  />
                  <View style={styles.commentHeaderInfo}>
                    <Text style={typography.body_white85}>
                      @{reply.author.nickname}
                    </Text>
                    <Text style={typography.additionalInfo_white25}>
                      {format(new Date(reply.createdAt), "dd.MM.yyyy HH:mm")}
                    </Text>
                    {me?.id === reply.author.id && (
                      <TouchableOpacity
                        onPress={() => {
                          deleteComment.mutate({ commentId: reply.id });
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="white"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <Text style={[typography.body_white100, styles.commentContent]}>
                  {reply.content}
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    handleReplyToComment(
                      reply.id,
                      reply.author.nickname,
                      true,
                      comment.id,
                    )
                  }
                  style={styles.replyButton}
                >
                  <Ionicons
                    name="arrow-undo-outline"
                    size={14}
                    color={COLORS.white85}
                  />
                  <Text style={typography.caption_white85}>Ответить</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>
      );
    },
    [
      expandedComments,
      toggleCommentExpand,
      handleReplyToComment,
      deleteComment,
      me?.id,
    ],
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) {
      return null;
    }

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.white85} />
      </View>
    );
  }, [isFetchingNextPage]);

  const ListHeaderComponent = useCallback(() => {
    if (!data?.post) {
      return null;
    }

    return (
      <View>
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
              <TouchableOpacity onPress={toggleLike}>
                <Ionicons
                  name={data.post.isLikedByMe ? "star" : "star-outline"}
                  size={20}
                  color={
                    data.post.isLikedByMe ? "red" : "rgba(255,255,255,0.45)"
                  }
                />
              </TouchableOpacity>
              <Text style={typography.caption_white85}>
                {data.post.likesCount} нравится
              </Text>
            </View>

            <View style={styles.action}>
              <Image
                source={require("../../assets/Icons/Activity/comments.png")}
                style={styles.action_img}
              />
              <Text style={typography.caption_white85}>
                {totalCommentsCount} комментариев
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.commentsHeader}>
          <Text style={typography.h4_white_85}>Комментарии</Text>
        </View>
      </View>
    );
  }, [data, toggleLike, totalCommentsCount]);

  if (isLoading) {
    return (
      <ImageBackground
        source={require("../../assets/backgrounds/application-bg.png")}
        style={styles.BackgroundImage}
      >
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.white85} />
          <StatusBar style="auto" />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (error) {
    return (
      <ImageBackground
        source={require("../../assets/backgrounds/application-bg.png")}
        style={styles.BackgroundImage}
      >
        <SafeAreaView style={styles.centerContent}>
          <Text style={typography.body_white85}>Error: {error.message}</Text>
          <StatusBar style="auto" />
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!data?.post) {
    return (
      <ImageBackground
        source={require("../../assets/backgrounds/application-bg.png")}
        style={styles.BackgroundImage}
      >
        <SafeAreaView />
      </ImageBackground>
    );
  }

  const onDeletePress = () => {
    Alert.alert(
      "Удалить пост?",
      "Пост будет скрыт (soft delete).",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost.mutateAsync({ postId: String(data.post.id) });

              utils.getPosts.invalidate();
              utils.getMyPosts.invalidate();
              utils.getRatedPosts.invalidate();
              navigation.goBack();
            } catch (e) {
              Alert.alert("Ошибка", e?.message ?? "Не удалось удалить пост");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const onUndoDeletePress = () => {
    Alert.alert(
      "Вернуть пост?",
      "Пост будет восстановлен.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Вернуть",
          style: "destructive",
          onPress: async () => {
            try {
              await undoDeletePost.mutateAsync({
                postId: String(data.post.id),
              });

              utils.getPosts.invalidate();
              utils.getMyPosts.invalidate();
              utils.getRatedPosts.invalidate();
              utils.getDeletedPosts.invalidate();
              navigation.goBack();
            } catch (e) {
              Alert.alert("Ошибка", e?.message ?? "Не удалось вернуть пост");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image source={require("../../assets/Icons/navIcons/goBack.png")} />
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
          {canDeletePost(me) && data.post.deletedAt == null && (
            <TouchableOpacity
              onPress={onDeletePress}
              disabled={deletePost.isPending}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
          )}

          {isUserAdmin(me) && data.post.deletedAt && (
            <TouchableOpacity
              onPress={onUndoDeletePress}
              disabled={undoDeletePost.isPending}
            >
              <Ionicons name="refresh-outline" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreComments}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            commentsLoading ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={COLORS.white85} />
              </View>
            ) : (
              <View style={styles.emptyComments}>
                <Text style={typography.body_white85}>
                  Комментариев пока нет
                </Text>
              </View>
            )
          }
        />

        <View style={styles.commentFormWrapper}>
          <AddCommentForm
            postId={data.post.id}
            parentId={replyingTo?.commentId}
            replyToNickname={replyingTo?.nickname}
            onSuccess={handleCommentSuccess}
            onCancelReply={cancelReply}
          />
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
  centerContent: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  commentActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  commentAvatar: {
    height: 40,
    width: 40,
  },
  commentCard: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 24,
    marginBottom: 8,
    padding: 16,
  },
  commentContent: {
    marginTop: 8,
  },
  commentFormWrapper: {
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 24,
    bottom: 28,
    left: 13,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    right: 13,
  },
  commentHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  commentHeaderInfo: {
    flexDirection: "column",
    gap: 2,
    justifyContent: "space-between",
  },
  commentWrapper: {
    marginBottom: 8,
  },
  commentsHeader: {
    marginBottom: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  dream_info: {
    gap: 12,
  },
  emptyComments: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 20,
  },
  flatListContent: {
    paddingBottom: 140,
    paddingHorizontal: 14,
    paddingTop: 14,
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
  loadingFooter: {
    alignItems: "center",
    paddingVertical: 20,
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
  repliesToggle: {
    flexDirection: "row",
    gap: 4,
  },
  replyAvatar: {
    height: 32,
    width: 32,
  },
  replyButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  replyCard: {
    backgroundColor: COLORS.postsCardBackground,
    borderLeftColor: COLORS.white25,
    borderLeftWidth: 2,
    borderRadius: 20,
    marginBottom: 8,
    marginLeft: 20,
    padding: 12,
  },
  safeArea: {
    flex: 1,
  },
});
