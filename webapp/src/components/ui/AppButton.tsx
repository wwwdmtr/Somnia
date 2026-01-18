import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

import { typography, COLORS } from "../../theme/typography";

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  TextStyle?: TextStyle;
  disabled?: boolean;
};

export const AppButton: React.FC<Props> = ({
  title,
  onPress,
  style,
  TextStyle,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabledButton, style]}
    >
      <Text style={[typography.button, TextStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: COLORS.buttonBackground,
    borderRadius: 99,
    height: 56,
    justifyContent: "center",
    width: "100%",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
