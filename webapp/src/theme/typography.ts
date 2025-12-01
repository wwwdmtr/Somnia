// src/theme/typography.ts
import { StyleSheet } from "react-native";

export type TextVariant = keyof typeof typography;

export type Typography = typeof typography;

export const COLORS = {
  white100: "#FFFFFF",
  white85: "rgba(255, 255, 255, 0.85)",
  white25: "rgba(255, 255, 255, 0.25)",
  descriptionColor: "#555",
  buttonBackground: "#1668DC",
  inputBackgroundColor: "rgba(7, 15, 50, 0.6)",
  inputBorderColor: "rgba(255, 255, 255, 0.25)",
  inputErrorBorderColor: "RED",
  linkColor: "rgba(22, 104, 220, 1)",
};

export const typography = StyleSheet.create({
  body: {
    fontFamily: "SFProText-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  body_white85: {
    color: COLORS.white85,
    fontFamily: "SFProText-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    color: COLORS.white100,
    fontFamily: "SFProText-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  caption_link: {
    color: COLORS.linkColor,
    fontFamily: "SFProText-Regular",
    fontSize: 14,
    lineHeight: 22,
    textDecorationLine: "underline",
  },
  caption_white85: {
    color: COLORS.white85,
    fontFamily: "SFProText-Regular",
    fontSize: 14,
    lineHeight: 22,
  },
  h1_white100: {
    color: COLORS.white100,
    fontFamily: "SFProText-Semibold",
    fontSize: 38,
    lineHeight: 46,
  },
  h2_white100: {
    color: COLORS.white100,
    fontFamily: "SFProText-Semibold",
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: "SFProText-Medium",
    fontSize: 16,
    lineHeight: 22,
  },
});
