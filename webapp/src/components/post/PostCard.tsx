/* eslint-disable @typescript-eslint/no-require-imports */
import { Ionicons } from "@expo/vector-icons";
import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import { format } from "date-fns";
import {
  Image,
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
  nickname: string;
};

export type PostCardModel = {
  author?: PostAuthor;
  commentsCount?: number;
  createdAt: Date | string;
  id: string;
  images: string[];
  isLikedByMe: boolean;
  likesCount: number;
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
  onOpenImageViewer: (images: string[], index: number) => void;
  onOpenPost: (postId: string) => void;
  onToggleLike: (postId: string, currentLikeState: boolean) => void;
  openPostOnTextPress?: boolean;
  post: PostCardModel;
  showAuthor?: boolean;
  showCommentsCount?: boolean;
  showReadMore?: boolean;
  textNumberOfLines?: number;
};

const DEFAULT_IMAGE_HEIGHT = 220;
const DEFAULT_IMAGE_WIDTH = 260;

export const PostCard = ({
  badgeColor = "rgba(255,255,255,0.2)",
  badgeLabel,
  commentsFallbackLabel = "комментариев",
  contentOrder = "mediaFirst",
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  imageWidth = DEFAULT_IMAGE_WIDTH,
  onOpenImageViewer,
  onOpenPost,
  onToggleLike,
  openPostOnTextPress = true,
  post,
  showAuthor = true,
  showCommentsCount = true,
  showReadMore = true,
  textNumberOfLines = 3,
}: PostCardProps) => {
  const createdAt = format(new Date(post.createdAt), "dd.MM.yyyy");

  const renderTextBlock = () => {
    const text = (
      <View style={styles.textContainer}>
        <Text style={typography.h4_white_85}>{post.title}</Text>
        <Text
          style={typography.body_white100}
          numberOfLines={textNumberOfLines}
        >
          {post.text}...
        </Text>
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

      <View style={styles.postHeader}>
        {showAuthor && post.author ? (
          <>
            <Image
              source={getAvatarSource(post.author.avatar, "small")}
              style={styles.cardImage}
            />
            <View style={styles.postHeaderInfo}>
              <Text style={typography.body_white85}>
                @{post.author.nickname}
              </Text>
              <Text style={typography.additionalInfo_white25}>{createdAt}</Text>
            </View>
          </>
        ) : (
          <Text style={typography.additionalInfo_white25}>{createdAt}</Text>
        )}
      </View>

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

      {showReadMore ? (
        <TouchableOpacity
          onPress={() => onOpenPost(post.id)}
          style={styles.readMore}
        >
          <Text style={typography.caption_link}>Читать далее...</Text>
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
