import type { AddPostStackParamList } from "./AddPostStackParamList";
import type { FeedStackParamList } from "./FeedStackParamList";
import type { ProfileStackParamList } from "./ProfileStackParamList";
import type { SearchStackParamList } from "./SearchStackParamList";
import type { NavigatorScreenParams } from "@react-navigation/native";

export type RootTabParamList = {
  FeedTab: NavigatorScreenParams<FeedStackParamList>;
  AddPostTab: NavigatorScreenParams<AddPostStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  SearchTab: NavigatorScreenParams<SearchStackParamList>;
};
