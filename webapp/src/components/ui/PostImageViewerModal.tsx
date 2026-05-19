import { Ionicons } from "@expo/vector-icons";
import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import React, { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import { COLORS, typography } from "../../theme/typography";

type PostImageViewerModalProps = {
  visible: boolean;
  imagePublicIds: string[];
  initialIndex?: number;
  onClose: () => void;
};

export const PostImageViewerModal = (props: PostImageViewerModalProps) => {
  if (!props.visible) {
    return null;
  }

  return <VisiblePostImageViewerModal {...props} />;
};

const VisiblePostImageViewerModal = ({
  visible,
  imagePublicIds,
  initialIndex = 0,
  onClose,
}: PostImageViewerModalProps) => {
  const { width, height } = useWindowDimensions();
  const flatListRef = useRef<FlatList<string>>(null);
  const safeInitialIndex = Math.max(
    0,
    Math.min(initialIndex, Math.max(imagePublicIds.length - 1, 0)),
  );
  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  const hasMultipleImages = imagePublicIds.length > 1;
  const currentSafeIndex = Math.max(
    0,
    Math.min(currentIndex, Math.max(imagePublicIds.length - 1, 0)),
  );

  const scrollToImageIndex = useCallback(
    (targetIndex: number, animated = true) => {
      if (imagePublicIds.length === 0) {
        return;
      }

      const clampedIndex = Math.max(
        0,
        Math.min(targetIndex, imagePublicIds.length - 1),
      );
      setCurrentIndex(clampedIndex);
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: clampedIndex,
          animated,
        });
      });
    },
    [imagePublicIds.length],
  );
  const updateCurrentIndexFromOffset = useCallback(
    (offsetX: number) => {
      if (width <= 0 || imagePublicIds.length === 0) {
        return;
      }

      const nextIndex = Math.max(
        0,
        Math.min(Math.round(offsetX / width), imagePublicIds.length - 1),
      );
      setCurrentIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    },
    [imagePublicIds.length, width],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        scrollToImageIndex(safeInitialIndex, false);
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={typography.body_white85}>
            {imagePublicIds.length > 0 ? currentSafeIndex + 1 : 0}/
            {imagePublicIds.length}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.white100} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          horizontal
          pagingEnabled
          data={imagePublicIds}
          initialScrollIndex={
            imagePublicIds.length > 0 ? safeInitialIndex : undefined
          }
          keyExtractor={(item, index) => `${item}-${index}`}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            index,
            length: width,
            offset: width * index,
          })}
          onScroll={(event) => {
            updateCurrentIndexFromOffset(event.nativeEvent.contentOffset.x);
          }}
          onMomentumScrollEnd={(event) => {
            updateCurrentIndexFromOffset(event.nativeEvent.contentOffset.x);
          }}
          scrollEventThrottle={16}
          onScrollToIndexFailed={() => {
            scrollToImageIndex(safeInitialIndex, false);
          }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width, height: height * 0.82 }]}>
              <Image
                source={{ uri: getCloudinaryUploadUrl(item, "image", "large") }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
        />

        {hasMultipleImages && currentSafeIndex > 0 ? (
          <TouchableOpacity
            accessibilityLabel="Предыдущее изображение"
            onPress={() => scrollToImageIndex(currentSafeIndex - 1)}
            style={[styles.navButton, styles.navButtonLeft]}
          >
            <Ionicons name="chevron-back" size={34} color={COLORS.white100} />
          </TouchableOpacity>
        ) : null}

        {hasMultipleImages && currentSafeIndex < imagePublicIds.length - 1 ? (
          <TouchableOpacity
            accessibilityLabel="Следующее изображение"
            onPress={() => scrollToImageIndex(currentSafeIndex + 1)}
            style={[styles.navButton, styles.navButtonRight]}
          >
            <Ionicons
              name="chevron-forward"
              size={34}
              color={COLORS.white100}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    alignItems: "center",
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 56,
    width: "100%",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  navButton: {
    alignItems: "center",
    backgroundColor: COLORS.mediaOverlay,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -24 }],
    width: 48,
  },
  navButtonLeft: {
    left: 18,
  },
  navButtonRight: {
    right: 18,
  },
  overlay: {
    backgroundColor: COLORS.imageFullScreenBackground,
    flex: 1,
  },
  slide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});
