import ScreenName from "../constants/ScreenName";

export type AdminStackParamList = {
  [ScreenName.AdminHome]: undefined;
  [ScreenName.DeletedPosts]: undefined;
  [ScreenName.Post]: { id: string };
  [ScreenName.EditPost]: { id: string };
};
