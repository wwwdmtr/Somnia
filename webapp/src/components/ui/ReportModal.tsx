import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SHELL_CONTENT_WIDTH } from "../../constants/layout";
import { webInputFocusReset } from "../../theme/inputFocus";
import { COLORS, typography } from "../../theme/typography";

import { AppButton } from "./AppButton";

type ReportModalProps = {
  visible: boolean;
  title: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (description: string) => void;
};

const MODAL_OVERLAY_BACKGROUND = COLORS.modalOverlay;

export const ReportModal = ({
  visible,
  title,
  isSubmitting,
  onClose,
  onSubmit,
}: ReportModalProps) => {
  const [description, setDescription] = useState("");

  const trimmedLength = description.trim().length;
  const isInvalid = trimmedLength < 10 || trimmedLength > 500;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            key={String(visible)}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            maxLength={500}
            placeholder="Опишите, что произошло"
            placeholderTextColor={COLORS.white25}
            style={styles.input}
          />

          <Text style={styles.counterText}>{trimmedLength}/500</Text>

          <AppButton
            title={isSubmitting ? "Отправляем..." : "Отправить жалобу"}
            onPress={() => onSubmit(description)}
            disabled={isSubmitting || isInvalid}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeText: {
    color: COLORS.white85,
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 24,
    gap: 12,
    maxWidth: SHELL_CONTENT_WIDTH,
    padding: 20,
    width: "100%",
  },
  counterText: {
    color: COLORS.white25,
    fontSize: 12,
    textAlign: "right",
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  input: {
    ...typography.body_white85,
    ...webInputFocusReset,
    backgroundColor: COLORS.navBarBackground,
    borderColor: COLORS.white25,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  overlay: {
    alignItems: "center",
    backgroundColor: MODAL_OVERLAY_BACKGROUND,
    flex: 1,
    justifyContent: "center",
    padding: 14,
  },
  title: {
    ...typography.h4_white_85,
    flexShrink: 1,
    paddingRight: 12,
  },
});
