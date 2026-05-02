import { Ionicons } from "@expo/vector-icons";
import { getCloudinaryUploadUrl } from "@somnia/shared/src/cloudinary/cloudinary";
import React, { useRef, useState } from "react";
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

export const PostImageViewerModal = ({
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        setCurrentIndex(safeInitialIndex);
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToIndex({
            index: safeInitialIndex,
            animated: false,
          });
        });
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={typography.body_white85}>
            {imagePublicIds.length > 0 ? currentIndex + 1 : 0}/
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
          onMomentumScrollEnd={(event) => {
            const nextIndex = Math.round(
              event.nativeEvent.contentOffset.x / width,
            );
            setCurrentIndex(nextIndex);
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
