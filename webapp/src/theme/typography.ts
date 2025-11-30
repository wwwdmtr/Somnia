// src/theme/typography.ts
import { StyleSheet, TextStyle } from "react-native";

type TextVariant =
  | "h1_white100"
  | "body_white85"
  | "h2"
  | "subtitle"
  | "body"
  | "button"
  | "caption";

type Typography = Record<TextVariant, TextStyle>;

export const COLORS = {
  white100: "#FFFFFF",
  white85: "rgba(255, 255, 255, 0.85)",
  descriptionColor: "#555",
  buttonBackground: "#1668DC",
};

export const typography: Typography = StyleSheet.create({
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
  caption: {
    fontFamily: "SFProText-Regular",
    fontSize: 12,
    lineHeight: 16,
  },
  h1_white100: {
    color: COLORS.white100,
    fontFamily: "SFProText-Semibold",
    fontSize: 38,
    lineHeight: 46,
  },
  h2: {
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
