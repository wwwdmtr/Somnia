/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getAvatarSource } from "../../lib/avatar";
import { COLORS, typography } from "../../theme/typography";

type PostAuthor = {
  avatar: string | null;
  id: string;
  nickname: string;
};

type PostPublisherCommunity = {
  avatar: string | null;
  id: string;
  name: string;
};

export type PostCardModel = {
  author?: PostAuthor;
  commentsCount?: number;
  createdAt: Date | string;
  id: string;
  images: string[];
  isLikedByMe: boolean;
  likesCount: number;
  publisherCommunity?: PostPublisherCommunity | null;
  publisherType?: "USER" | "COMMUNITY";
  text: string;
  title: string;
};

type PostCardProps = {
  badgeColor?: string;
  badgeLabel?: string;
  commentsFallbackLabel?: string;
  contentOrder?: "mediaFirst" | "textFirst";
  imageHeight?: number;
  imageWidth?: number;
  onOpenCommunity?: (communityId: string) => void;
  onOpenImageViewer: (images: string[], index: number) => void;
  onOpenPost: (postId: string) => void;
  onOpenUser?: (userId: string) => void;
  onToggleLike: (postId: string, currentLikeState: boolean) => void;
  openPostOnTextPress?: boolean;
  post: PostCardModel;
  readMoreLabel?: string;
  showAuthor?: boolean;
  showCommentsCount?: boolean;
  showReadMoreOnlyWhenTruncated?: boolean;
  showReadMore?: boolean;
  textNumberOfLines?: number;
};

const DEFAULT_MAX_IMAGE_HEIGHT = 650;
const DEFAULT_IMAGE_WIDTH = 260;
const PREVIEW_TEXT_LINE_HEIGHT = 24;
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

export const PostCard = ({
  badgeColor = "rgba(255,255,255,0.2)",
  badgeLabel,
  commentsFallbackLabel = "комментариев",
  contentOrder = "mediaFirst",
  imageHeight = DEFAULT_MAX_IMAGE_HEIGHT,
  imageWidth = DEFAULT_IMAGE_WIDTH,
  onOpenCommunity,
  onOpenImageViewer,
  onOpenPost,
  onOpenUser,
  onToggleLike,
  openPostOnTextPress = true,
  post,
  readMoreLabel = "Читать весь пост",
  showAuthor = true,
  showCommentsCount = true,
  showReadMoreOnlyWhenTruncated = true,
  showReadMore = true,
  textNumberOfLines = 20,
}: PostCardProps) => {
  const createdAt = format(new Date(post.createdAt), "dd.MM.yyyy");
  const [previewTextHeight, setPreviewTextHeight] = useState(0);
  const [fullTextHeight, setFullTextHeight] = useState(0);
  const [mediaContainerWidth, setMediaContainerWidth] = useState(0);
  const [mediaCursor, setMediaCursor] = useState<{
    index: number;
    postId: string;
  }>({
    index: 0,
    postId: post.id,
  });
  const mediaCarouselRef = useRef<FlatList<string>>(null);
  const [mainImageAspectRatioState, setMainImageAspectRatioState] = useState<{
    ratio: number;
    url: string;
  } | null>(null);
  const shouldMeasureTruncation = showReadMore && showReadMoreOnlyWhenTruncated;
  const primaryImagePublicId = post.images[0];
  const primaryImageUrl = primaryImagePublicId
    ? getCloudinaryUploadUrl(primaryImagePublicId, "image", "large")
    : null;
  const cachedMainImageAspectRatio = primaryImageUrl
    ? imageAspectRatioCache.get(primaryImageUrl)
    : undefined;
  const currentMainImageAspectRatio =
    cachedMainImageAspectRatio ??
    (primaryImageUrl && mainImageAspectRatioState?.url === primaryImageUrl
      ? mainImageAspectRatioState.ratio
      : FALLBACK_IMAGE_ASPECT_RATIO);
  const currentMediaIndex =
    mediaCursor.postId === post.id ? mediaCursor.index : 0;
  const hasMultipleImages = post.images.length > 1;
  const maxImageHeight = Math.max(
    1,
    Math.min(imageHeight, DEFAULT_MAX_IMAGE_HEIGHT),
  );
  const usableContainerWidth = Math.max(1, mediaContainerWidth || imageWidth);
  const mediaSize = useMemo(
    () =>
      getContainedImageSize({
        containerWidth: usableContainerWidth,
        aspectRatio: currentMainImageAspectRatio,
        maxHeight: maxImageHeight,
      }),
    [usableContainerWidth, currentMainImageAspectRatio, maxImageHeight],
  );
  const isCommunityPost =
    post.publisherType === "COMMUNITY" && Boolean(post.publisherCommunity);
  const publisherName =
    isCommunityPost && post.publisherCommunity
      ? post.publisherCommunity.name
      : post.author
        ? `@${post.author.nickname}`
        : null;
  const publisherMetaText =
    isCommunityPost && post.author
      ? `${createdAt} • @${post.author.nickname}`
      : createdAt;
  const publisherAvatar =
    isCommunityPost && post.publisherCommunity
      ? post.publisherCommunity.avatar
      : post.author?.avatar;

  useEffect(() => {
    if (!primaryImageUrl) {
      return;
    }

    const cachedAspectRatio = imageAspectRatioCache.get(primaryImageUrl);
    if (cachedAspectRatio) {
      return;
    }

    let isMounted = true;
    Image.getSize(
      primaryImageUrl,
      (width, height) => {
        if (!isMounted || !width || !height) {
          return;
        }

        const nextAspectRatio = width / height;
        if (!Number.isFinite(nextAspectRatio) || nextAspectRatio <= 0) {
          return;
        }

        imageAspectRatioCache.set(primaryImageUrl, nextAspectRatio);
        setMainImageAspectRatioState({
          ratio: nextAspectRatio,
          url: primaryImageUrl,
        });
      },
      () => {
        // keep fallback ratio
      },
    );

    return () => {
      isMounted = false;
    };
  }, [primaryImageUrl]);

  const handleMediaScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!hasMultipleImages || mediaSize.width <= 0) {
        return;
      }

      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / mediaSize.width,
      );
      const clampedIndex = Math.max(
        0,
        Math.min(nextIndex, post.images.length - 1),
      );
      setMediaCursor({
        index: clampedIndex,
        postId: post.id,
      });
    },
    [hasMultipleImages, mediaSize.width, post.id, post.images.length],
  );

  const scrollToMediaIndex = useCallback(
    (targetIndex: number) => {
      if (!hasMultipleImages || !mediaCarouselRef.current) {
        return;
      }

      const clampedIndex = Math.max(
        0,
        Math.min(targetIndex, post.images.length - 1),
      );
      mediaCarouselRef.current.scrollToIndex({
        index: clampedIndex,
        animated: true,
      });
      setMediaCursor({
        index: clampedIndex,
        postId: post.id,
      });
    },
    [hasMultipleImages, post.id, post.images.length],
  );

  const handlePreviewTextLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setPreviewTextHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  const handleFullTextLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    setFullTextHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  const renderTextBlock = () => {
    const text = (
      <View style={styles.textContainer}>
        <Text style={typography.h4_white_85}>{post.title}</Text>
        <View style={styles.bodyTextWrapper}>
          {shouldMeasureTruncation ? (
            <Text
              style={[typography.body_white100, styles.measurementText]}
              onLayout={handleFullTextLayout}
              accessible={false}
            >
              {post.text}
            </Text>
          ) : null}
          <View
            style={[
              styles.previewTextContainer,
              {
                maxHeight: textNumberOfLines * PREVIEW_TEXT_LINE_HEIGHT,
              },
            ]}
            onLayout={
              shouldMeasureTruncation ? handlePreviewTextLayout : undefined
            }
          >
            <Text style={[typography.body_white100, styles.previewText]}>
              {post.text}
            </Text>
          </View>
        </View>
      </View>
    );

    if (!openPostOnTextPress) {
      return text;
    }

    return (
      <TouchableOpacity onPress={() => onOpenPost(post.id)}>
        {text}
      </TouchableOpacity>
    );
  };

  const renderMedia = () => {
    if (post.images.length === 0) {
      return null;
    }

    return (
      <View
        style={styles.postMediaWrapper}
        onLayout={(event) => {
          const nextWidth = Math.ceil(event.nativeEvent.layout.width);
          setMediaContainerWidth((prev) =>
            prev === nextWidth ? prev : nextWidth,
          );
        }}
      >
        <View
          style={[
            styles.postMediaFrame,
            {
              height: mediaSize.height,
              width: mediaSize.width,
            },
          ]}
        >
          <FlatList
            ref={mediaCarouselRef}
            key={post.id}
            horizontal
            pagingEnabled
            bounces={false}
            scrollEnabled={hasMultipleImages}
            data={post.images}
            keyExtractor={(item, index) => `${item}-${index}`}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              index,
              length: mediaSize.width,
              offset: mediaSize.width * index,
            })}
            onMomentumScrollEnd={handleMediaScrollEnd}
            onScrollToIndexFailed={() => {
              // no-op
            }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onOpenImageViewer(post.images, index)}
              >
                <Image
                  source={{
                    uri: getCloudinaryUploadUrl(item, "image", "large"),
                  }}
                  style={[
                    styles.postPreviewImageMain,
                    {
                      height: mediaSize.height,
                      width: mediaSize.width,
                    },
                  ]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          />
          {hasMultipleImages ? (
            <View style={styles.mediaCounter}>
              <Text style={styles.mediaCounterText}>
                {currentMediaIndex + 1}/{post.images.length}
              </Text>
            </View>
          ) : null}
          {hasMultipleImages && currentMediaIndex > 0 ? (
            <TouchableOpacity
              style={[styles.mediaArrow, styles.mediaArrowLeft]}
              onPress={() => scrollToMediaIndex(currentMediaIndex - 1)}
            >
              <Ionicons name="chevron-back" size={18} color={COLORS.white100} />
            </TouchableOpacity>
          ) : null}
          {hasMultipleImages && currentMediaIndex < post.images.length - 1 ? (
            <TouchableOpacity
              style={[styles.mediaArrow, styles.mediaArrowRight]}
              onPress={() => scrollToMediaIndex(currentMediaIndex + 1)}
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
    );
  };

  const renderCommentsText = () => {
    if (showCommentsCount && typeof post.commentsCount === "number") {
      return `${post.commentsCount} комментариев`;
    }

    return commentsFallbackLabel;
  };

  const isTextTruncated =
    shouldMeasureTruncation &&
    fullTextHeight > 0 &&
    previewTextHeight > 0 &&
    fullTextHeight > previewTextHeight + 1;
  const shouldShowReadMore =
    showReadMore && (!showReadMoreOnlyWhenTruncated || isTextTruncated);

  return (
    <View style={styles.card}>
      {badgeLabel ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor,
            },
          ]}
        >
          <Text style={typography.caption_white85}>{badgeLabel}</Text>
        </View>
      ) : null}

      {showAuthor && publisherName ? (
        <TouchableOpacity
          style={styles.postHeader}
          disabled={
            isCommunityPost
              ? !(post.publisherCommunity && onOpenCommunity)
              : !(post.author?.id && onOpenUser)
          }
          onPress={() => {
            if (isCommunityPost && post.publisherCommunity && onOpenCommunity) {
              onOpenCommunity(post.publisherCommunity.id);
              return;
            }

            if (!isCommunityPost && post.author?.id && onOpenUser) {
              onOpenUser(post.author.id);
            }
          }}
        >
          <Image
            source={getAvatarSource(publisherAvatar, "small")}
            style={styles.cardImage}
          />
          <View style={styles.postHeaderInfo}>
            <Text style={typography.body_white85}>{publisherName}</Text>
            <Text style={typography.additionalInfo_white25}>
              {publisherMetaText}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.postHeader}>
          <Text style={typography.additionalInfo_white25}>{createdAt}</Text>
        </View>
      )}

      {contentOrder === "textFirst" ? (
        <>
          {renderTextBlock()}
          {renderMedia()}
        </>
      ) : (
        <>
          {renderMedia()}
          {renderTextBlock()}
        </>
      )}

      {shouldShowReadMore ? (
        <TouchableOpacity
          onPress={() => onOpenPost(post.id)}
          style={styles.readMore}
        >
          <Text style={typography.caption_link}>{readMoreLabel}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.action}>
          <TouchableOpacity
            onPress={() => onToggleLike(post.id, post.isLikedByMe)}
          >
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
            style={styles.actionImage}
          />
          <TouchableOpacity onPress={() => onOpenPost(post.id)}>
            <Text style={typography.caption_white85}>
              {renderCommentsText()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  action: {
    flexDirection: "row",
    gap: 7,
  },
  actionImage: {
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
  badge: {
    alignItems: "center",
    borderRadius: 12,
    height: 24,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    top: 20,
    width: 40,
    zIndex: 1,
  },
  bodyTextWrapper: {
    position: "relative",
  },
  card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    marginBottom: 8,
    padding: 20,
    position: "relative",
  },
  cardImage: {
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  measurementText: {
    left: 0,
    opacity: 0,
    pointerEvents: "none",
    position: "absolute",
    right: 0,
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
    marginBottom: 24,
    width: "100%",
  },
  postHeaderInfo: {
    flexDirection: "column",
    gap: 4,
    justifyContent: "space-between",
  },
  postMediaFrame: {
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  postMediaWrapper: {
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  postPreviewImageMain: {
    backgroundColor: COLORS.imageEmptyFieldsBackground,
    borderRadius: 14,
  },
  previewText: {
    lineHeight: PREVIEW_TEXT_LINE_HEIGHT,
  },
  previewTextContainer: {
    overflow: "hidden",
  },
  readMore: {
    marginTop: 8,
  },
  textContainer: {
    gap: 12,
  },
});
