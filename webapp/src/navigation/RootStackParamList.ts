import ScreenName from "../constants/ScreenName";

import type { AdminStackParamList } from "./AdminStackParamList";
import type { RootTabParamList } from "./RootTabParamList";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  [ScreenName.RootTabs]: NavigatorScreenParams<RootTabParamList>;
  [ScreenName.AdminStack]: NavigatorScreenParams<AdminStackParamList>;
};
