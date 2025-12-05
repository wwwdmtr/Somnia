import type { AddDreamStackParamList } from "./AddDreamStackParamList";
import type { FeedStackParamList } from "./FeedStackParamList";
import type { ProfileStackParamList } from "./ProfileStackParamList";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootTabParamList = {
  FeedTab: NavigatorScreenParams<FeedStackParamList>;
  AddDreamTab: NavigatorScreenParams<AddDreamStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
