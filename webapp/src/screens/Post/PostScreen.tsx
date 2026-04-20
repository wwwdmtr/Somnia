/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  RouteProp,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import { isUserAdmin } from "@somnia/shared/src/utils/can";
import { format } from "date-fns/format";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  RefreshControl,
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddCommentForm } from "../../components/forms/AddCommentForm";
import { PostImageViewerModal } from "../../components/ui/PostImageViewerModal";
import ScreenName from "../../constants/ScreenName";
import { getAvatarSource } from "../../lib/avatar";
import { useMe } from "../../lib/ctx";
import { usePostLikeMutation } from "../../lib/postLikeMutation";
import { trpc } from "../../lib/trpc";
import { typography, COLORS } from "../../theme/typography";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type PostScreenStackParamList = {
  [ScreenName.Post]: { id: string };
  [ScreenName.EditPost]: { id: string };
  [ScreenName.Community]: { id: string };
  [ScreenName.Profile]: {
    userId?: string;
  };
};

type PostScreenRouteProp = RouteProp<PostScreenStackParamList, ScreenName.Post>;
type PostScreenNavProp = NativeStackNavigationProp<
  PostScreenStackParamList,
  ScreenName.Post
>;
const MAX_INFINITE_PAGES = 10;
const MAX_POST_IMAGE_HEIGHT = 650;
const DEFAULT_POST_IMAGE_WIDTH = 280;
const FALLBACK_IMAGE_ASPECT_RATIO = 4 / 3;
const imageAspectRatioCache = new Map<string, number>();
const MEDIA_COUNTER_BACKGROUND = "rgba(0,0,0,0.45)";
const MEDIA_ARROW_BACKGROUND = "rgba(0,0,0,0.4)";

const getContainedImageSize = ({
  containerWidth,
  aspectRatio,
  maxHeight,
}: {
  containerWidth: number;
  aspectRatio: number;
  maxHeight: number;
}) => {
  if (containerWidth <= 0 || aspectRatio <= 0 || maxHeight <= 0) {
    return {
      width: 0,
      height: 0,
    };
  }

  let width = containerWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width,
    height,
  };
};

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    nickname: string;
    name: string;
    avatar: string | null;
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
      avatar: string | null;
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
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
  }>({
    isOpen: false,
    images: [],
    index: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [postImageContainerWidth, setPostImageContainerWidth] = useState(0);
  const [postImageCursor, setPostImageCursor] = useState<{
    index: number;
    postId: string;
  }>({
    index: 0,
    postId: route.params.id,
  });
  const postImageCarouselRef = useRef<FlatList<string>>(null);
  const [postImageAspectRatioState, setPostImageAspectRatioState] = useState<{
    ratio: number;
    url: string;
  } | null>(null);
  const undoDeletePost = trpc.undoDeletePost.useMutation();

  type PostData = NonNullable<ReturnType<typeof utils.getPost.getData>>;

  const {
    data,
    isLoading,
    error,
    refetch: refetchPost,
  } = trpc.getPost.useQuery({
    id: route.params.id,
  });

  const {
    data: commentsData,
    isLoading: commentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchComments,
  } = trpc.getCommentsByPost.useInfiniteQuery(
    {
      postId: route.params.id,
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      maxPages: MAX_INFINITE_PAGES,
    },
  );

  const comments = commentsData?.pages.flatMap((page) => page.comments) ?? [];
  const totalCommentsCount = comments.length;
  const primaryPostImagePublicId = data?.post?.images[0];
  const primaryPostImageUrl = primaryPostImagePublicId
    ? getCloudinaryUploadUrl(primaryPostImagePublicId, "image", "large")
    : null;
  const cachedPostImageAspectRatio = primaryPostImageUrl
    ? imageAspectRatioCache.get(primaryPostImageUrl)
    : undefined;
  const currentPostImageAspectRatio =
    cachedPostImageAspectRatio ??
    (primaryPostImageUrl &&
    postImageAspectRatioState?.url === primaryPostImageUrl
      ? postImageAspectRatioState.ratio
      : FALLBACK_IMAGE_ASPECT_RATIO);
  const currentPostId = data?.post?.id ?? route.params.id;
  const currentPostImageIndex =
    postImageCursor.postId === currentPostId ? postImageCursor.index : 0;
  const hasMultiplePostImages = (data?.post?.images.length ?? 0) > 1;
  const postImageWidthBase =
    postImageContainerWidth || DEFAULT_POST_IMAGE_WIDTH;
  const usablePostImageContainerWidth = Math.max(1, postImageWidthBase);
  const postImageSize = useMemo(
    () =>
      getContainedImageSize({
        containerWidth: usablePostImageContainerWidth,
        aspectRatio: currentPostImageAspectRatio,
        maxHeight: MAX_POST_IMAGE_HEIGHT,
      }),
    [usablePostImageContainerWidth, currentPostImageAspectRatio],
  );

  useEffect(() => {
    if (!primaryPostImageUrl) {
      return;
    }

    const cachedAspectRatio = imageAspectRatioCache.get(primaryPostImageUrl);
    if (cachedAspectRatio) {
      return;
    }

    let isMounted = true;
    Image.getSize(
      primaryPostImageUrl,
      (width, height) => {
        if (!isMounted || !width || !height) {
          return;
        }

        const nextAspectRatio = width / height;
        if (!Number.isFinite(nextAspectRatio) || nextAspectRatio <= 0) {
          return;
        }

        imageAspectRatioCache.set(primaryPostImageUrl, nextAspectRatio);
        setPostImageAspectRatioState({
          ratio: nextAspectRatio,
          url: primaryPostImageUrl,
        });
      },
      () => {
        // keep fallback ratio
      },
    );

    return () => {
      isMounted = false;
    };
  }, [primaryPostImageUrl]);

  const handlePostImageScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasMultiplePostImages || postImageSize.width <= 0) {
        return;
      }

      const totalImages = data?.post?.images.length ?? 0;
      if (totalImages === 0) {
        return;
      }

      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / postImageSize.width,
      );
      const clampedIndex = Math.max(0, Math.min(nextIndex, totalImages - 1));
      setPostImageCursor({
        index: clampedIndex,
        postId: currentPostId,
      });
    },
    [
      currentPostId,
      data?.post?.images.length,
      hasMultiplePostImages,
      postImageSize.width,
    ],
  );

  const scrollToPostImage = useCallback(
    (targetIndex: number) => {
      if (!hasMultiplePostImages || !postImageCarouselRef.current) {
        return;
      }

      const totalImages = data?.post?.images.length ?? 0;
      if (totalImages === 0) {
        return;
      }

      const clampedIndex = Math.max(0, Math.min(targetIndex, totalImages - 1));
      postImageCarouselRef.current.scrollToIndex({
        index: clampedIndex,
        animated: true,
      });
      setPostImageCursor({
        index: clampedIndex,
        postId: currentPostId,
      });
    },
    [currentPostId, data?.post?.images.length, hasMultiplePostImages],
  );

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

  const setPostLike = usePostLikeMutation<PostData>({
    applyOptimistic: (old, variables) => {
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
    },
    applyServer: (old, likeData) => {
      if (!old?.post) {
        return old;
      }

      return {
        ...old,
        post: {
          ...old.post,
          isLikedByMe: likeData.isLikedByMe,
          likesCount: likeData.likesCount,
        },
      };
    },
    cancel: () => utils.getPost.cancel({ id: route.params.id }),
    getData: () => utils.getPost.getData({ id: route.params.id }),
    setData: (updater) =>
      utils.getPost.setData({ id: route.params.id }, updater),
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
    const post = data.post;

    setPostLike.mutate({
      postId: post.id,
      isLikedByMe: !post.isLikedByMe,
    });
  }, [data, setPostLike]);

  const openImageViewer = useCallback((images: string[], index: number) => {
    setImageViewerState({
      isOpen: true,
      images,
      index,
    });
  }, []);
  const handleOpenCommunity = useCallback(
    (communityId: string) => {
      navigation.navigate(ScreenName.Community, {
        id: communityId,
      });
    },
    [navigation],
  );
  const handleOpenProfile = useCallback(
    (userId: string) => {
      navigation.navigate(ScreenName.Profile, {
        userId,
      });
    },
    [navigation],
  );

  const loadMoreComments = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchPost(), refetchComments()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchPost, refetchComments]);

  const renderComment = useCallback(
    ({ item: comment }: { item: Comment }) => {
      const isExpanded = expandedComments.has(comment.id);
      const hasReplies = comment.repliesCount > 0;

      return (
        <View style={styles.commentWrapper}>
          <View style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Image
                source={getAvatarSource(comment.author.avatar, "small")}
                style={styles.commentAvatar}
              />
              <View style={styles.commentHeaderInfo}>
                <TouchableOpacity
                  onPress={() => handleOpenProfile(comment.author.id)}
                >
                  <Text style={typography.body_white85}>
                    @{comment.author.nickname}
                  </Text>
                </TouchableOpacity>
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
                    source={getAvatarSource(reply.author.avatar, "small")}
                    style={styles.replyAvatar}
                  />
                  <View style={styles.commentHeaderInfo}>
                    <TouchableOpacity
                      onPress={() => handleOpenProfile(reply.author.id)}
                    >
                      <Text style={typography.body_white85}>
                        @{reply.author.nickname}
                      </Text>
                    </TouchableOpacity>
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
      handleOpenProfile,
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

  const listHeaderComponent = useMemo(() => {
    if (!data?.post) {
      return null;
    }
    const post = data.post;
    const isCommunityPost =
      post.publisherType === "COMMUNITY" && Boolean(post.publisherCommunity);
    const headerName =
      isCommunityPost && post.publisherCommunity
        ? post.author
          ? `${post.publisherCommunity.name} • @${post.author.nickname}`
          : post.publisherCommunity.name
        : post.author
          ? `@${post.author.nickname}`
          : "Пользователь";
    const headerAvatar =
      isCommunityPost && post.publisherCommunity
        ? post.publisherCommunity.avatar
        : post.author?.avatar;

    return (
      <View>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.postHeader}
            disabled={
              isCommunityPost ? !post.publisherCommunity : !post.author?.id
            }
            onPress={() => {
              if (isCommunityPost && post.publisherCommunity) {
                handleOpenCommunity(post.publisherCommunity.id);
                return;
              }

              if (post.author?.id) {
                handleOpenProfile(post.author.id);
              }
            }}
          >
            <Image
              source={getAvatarSource(headerAvatar, "small")}
              style={styles.cardImage}
            />
            <View style={styles.postHeaderInfo}>
              <Text style={typography.body_white85}>{headerName}</Text>
              <Text style={typography.additionalInfo_white25}>
                {format(new Date(post.createdAt), "dd.MM.yyyy")}
              </Text>
            </View>
          </TouchableOpacity>

          {post.images.length > 0 ? (
            <View
              style={styles.postImagesWrapper}
              onLayout={(event) => {
                const nextWidth = Math.ceil(event.nativeEvent.layout.width);
                setPostImageContainerWidth((prev) =>
                  prev === nextWidth ? prev : nextWidth,
                );
              }}
            >
              <View
                style={[
                  styles.postImageFrame,
                  {
                    height: postImageSize.height,
                    width: postImageSize.width,
                  },
                ]}
              >
                <FlatList
                  ref={postImageCarouselRef}
                  key={post.id}
                  horizontal
                  pagingEnabled
                  bounces={false}
                  scrollEnabled={hasMultiplePostImages}
                  data={post.images}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  showsHorizontalScrollIndicator={false}
                  getItemLayout={(_, index) => ({
                    index,
                    length: postImageSize.width,
                    offset: postImageSize.width * index,
                  })}
                  onMomentumScrollEnd={handlePostImageScrollEnd}
                  onScrollToIndexFailed={() => {
                    // no-op
                  }}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => openImageViewer(post.images, index)}
                    >
                      <Image
                        source={{
                          uri: getCloudinaryUploadUrl(item, "image", "large"),
                        }}
                        style={[
                          styles.postImageMain,
                          {
                            height: postImageSize.height,
                            width: postImageSize.width,
                          },
                        ]}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  )}
                />
                {hasMultiplePostImages ? (
                  <View style={styles.mediaCounter}>
                    <Text style={styles.mediaCounterText}>
                      {currentPostImageIndex + 1}/{post.images.length}
                    </Text>
                  </View>
                ) : null}
                {hasMultiplePostImages && currentPostImageIndex > 0 ? (
                  <TouchableOpacity
                    style={[styles.mediaArrow, styles.mediaArrowLeft]}
                    onPress={() => scrollToPostImage(currentPostImageIndex - 1)}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={COLORS.white100}
                    />
                  </TouchableOpacity>
                ) : null}
                {hasMultiplePostImages &&
                currentPostImageIndex < post.images.length - 1 ? (
                  <TouchableOpacity
                    style={[styles.mediaArrow, styles.mediaArrowRight]}
                    onPress={() => scrollToPostImage(currentPostImageIndex + 1)}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.white100}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.dream_info}>
            <Text style={typography.h4_white_85}>{post.title}</Text>
            <Text style={typography.body_white100}>{post.text}</Text>
          </View>

          <View style={styles.actions}>
            <View style={styles.action}>
              <TouchableOpacity onPress={toggleLike}>
                <Ionicons
                  name={post.isLikedByMe ? "star" : "star-outline"}
                  size={20}
                  color={post.isLikedByMe ? "red" : "rgba(255,255,255,0.45)"}
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
  }, [
    data,
    handleOpenCommunity,
    handleOpenProfile,
    handlePostImageScrollEnd,
    hasMultiplePostImages,
    currentPostImageIndex,
    openImageViewer,
    postImageSize.height,
    postImageSize.width,
    scrollToPostImage,
    toggleLike,
    totalCommentsCount,
  ]);

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
  const post = data.post;

  const onUndoDeletePress = () => {
    const postId = String(post.id);

    const executeUndoDeletePost = async () => {
      try {
        await undoDeletePost.mutateAsync({
          postId,
        });

        utils.getPosts.invalidate();
        utils.getMyPosts.invalidate();
        utils.getUserPosts.invalidate();
        utils.getRatedPosts.invalidate();
        utils.getDeletedPosts.invalidate();
        navigation.goBack();
      } catch (error) {
        Alert.alert(
          "Ошибка",
          error instanceof Error ? error.message : "Не удалось вернуть пост",
        );
      }
    };

    if (Platform.OS === "web") {
      const shouldUndoDelete =
        typeof window !== "undefined"
          ? window.confirm("Вернуть пост? Пост будет восстановлен.")
          : true;
      if (!shouldUndoDelete) {
        return;
      }
      void executeUndoDeletePost();
      return;
    }

    Alert.alert(
      "Вернуть пост?",
      "Пост будет восстановлен.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Вернуть",
          style: "destructive",
          onPress: () => {
            void executeUndoDeletePost();
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

          {post.canEditByMe && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(ScreenName.EditPost, {
                  id: String(post.id),
                })
              }
            >
              <Ionicons name="create-outline" size={24} color="white" />
            </TouchableOpacity>
          )}

          {isUserAdmin(me) && post.deletedAt && (
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
          ListHeaderComponent={listHeaderComponent}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreComments}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.white85}
            />
          }
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
            postId={post.id}
            parentId={replyingTo?.commentId}
            replyToNickname={replyingTo?.nickname}
            onSuccess={handleCommentSuccess}
            onCancelReply={cancelReply}
          />
        </View>
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
    borderRadius: 24,
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
    borderRadius: 20,
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
  mediaArrow: {
    alignItems: "center",
    backgroundColor: MEDIA_ARROW_BACKGROUND,
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -14 }],
    width: 28,
  },
  mediaArrowLeft: {
    left: 8,
  },
  mediaArrowRight: {
    right: 8,
  },
  mediaCounter: {
    alignItems: "center",
    backgroundColor: MEDIA_COUNTER_BACKGROUND,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8,
    top: 8,
  },
  mediaCounterText: {
    color: COLORS.white100,
    fontSize: 12,
    fontWeight: "600",
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
  postImageFrame: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  postImageMain: {
    backgroundColor: COLORS.imageEmptyFieldsBackground,
    borderRadius: 16,
  },
  postImagesWrapper: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
    width: "100%",
  },
  repliesToggle: {
    flexDirection: "row",
    gap: 4,
  },
  replyAvatar: {
    borderRadius: 16,
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
    paddingBottom: 120,
  },
});
