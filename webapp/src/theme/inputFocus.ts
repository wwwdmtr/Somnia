import { Platform } from "react-native";

import type { TextStyle } from "react-native";

export const webInputFocusReset = (Platform.OS === "web"
  ? {
      boxShadow: "none",
      outlineColor: "transparent",
      outlineStyle: "none",
      outlineWidth: 0,
    }
  : {}) as unknown as TextStyle;
