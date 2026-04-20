/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import { format } from "date-fns";
import { useCallback, useState } from "react";
import {
  Image,
  type LayoutChangeEvent,
  ScrollView,
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

const DEFAULT_IMAGE_HEIGHT = 220;
const DEFAULT_IMAGE_WIDTH = 260;
const PREVIEW_TEXT_LINE_HEIGHT = 24;

export const PostCard = ({
  badgeColor = "rgba(255,255,255,0.2)",
  badgeLabel,
  commentsFallbackLabel = "комментариев",
  contentOrder = "mediaFirst",
  imageHeight = DEFAULT_IMAGE_HEIGHT,
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
  const shouldMeasureTruncation = showReadMore && showReadMoreOnlyWhenTruncated;
  const isCommunityPost =
    post.publisherType === "COMMUNITY" && Boolean(post.publisherCommunity);
  const publisherName =
    isCommunityPost && post.publisherCommunity
      ? post.author
        ? `${post.publisherCommunity.name} • @${post.author.nickname}`
        : post.publisherCommunity.name
      : post.author
        ? `@${post.author.nickname}`
        : null;
  const publisherAvatar =
    isCommunityPost && post.publisherCommunity
      ? post.publisherCommunity.avatar
      : post.author?.avatar;

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

    if (post.images.length === 1) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onOpenImageViewer(post.images, 0)}
        >
          <Image
            source={{
              uri: getCloudinaryUploadUrl(post.images[0], "image", "large"),
            }}
            style={[
              styles.singlePostPreviewImage,
              {
                height: imageHeight,
              },
            ]}
            resizeMode="contain"
          />
        </TouchableOpacity>
      );
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.postImagesScroller}
        contentContainerStyle={styles.postImagesContainer}
      >
        {post.images.map((imagePublicId, imageIndex) => (
          <TouchableOpacity
            key={`${imagePublicId}-${imageIndex}`}
            activeOpacity={0.9}
            onPress={() => onOpenImageViewer(post.images, imageIndex)}
          >
            <Image
              source={{
                uri: getCloudinaryUploadUrl(imagePublicId, "image", "large"),
              }}
              style={[
                styles.postPreviewImage,
                {
                  height: imageHeight,
                  width: imageWidth,
                },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
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
            <Text style={typography.additionalInfo_white25}>{createdAt}</Text>
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
  postImagesContainer: {
    gap: 10,
    paddingRight: 8,
  },
  postImagesScroller: {
    marginBottom: 16,
  },
  postPreviewImage: {
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
  singlePostPreviewImage: {
    backgroundColor: COLORS.imageEmptyFieldsBackground,
    borderRadius: 14,
    marginBottom: 16,
    width: "100%",
  },
  textContainer: {
    gap: 12,
  },
});
