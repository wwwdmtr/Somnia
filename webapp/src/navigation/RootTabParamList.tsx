import type { FeedStackParamList } from "./FeedStackParamList";
import type { ProfileStackParamList } from "./ProfileStackParamList";
import type { UserDreamStackParamList } from "./UserDreamStackParamList";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootTabParamList = {
  FeedTab: NavigatorScreenParams<FeedStackParamList>;
  UserDreamTab: NavigatorScreenParams<UserDreamStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};
