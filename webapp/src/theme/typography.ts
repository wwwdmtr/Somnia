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
  navBarBackground: "rgba(7, 15, 50, 1)",
  postsCardBackground: "rgba(7, 15, 50, 0.6)",
};

export const typography = StyleSheet.create({
  additionalInfo_white25: {
    color: COLORS.white25,
    fontFamily: "SFProText-Regular",
    fontSize: 12,
    lineHeight: 20,
  },
  body_white100: {
    color: COLORS.white100,
    fontFamily: "SFProText-Regular",
    fontSize: 16,
    lineHeight: 24,
  },
  body_white25: {
    color: COLORS.white25,
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
  },
  caption_link_underline: {
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
  h2_white85: {
    color: COLORS.white85,
    fontFamily: "SFProText-Semibold",
    fontSize: 30,
    lineHeight: 38,
  },
  h3_white_85: {
    color: COLORS.white85,
    fontFamily: "SFProText-Semibold",
    fontSize: 20,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: "SFProText-Medium",
    fontSize: 16,
    lineHeight: 22,
  },
});
