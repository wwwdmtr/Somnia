import ScreenName from "../constants/ScreenName";

export type AdminStackParamList = {
  [ScreenName.AdminHome]: undefined;
  [ScreenName.DeletedPosts]: undefined;
  [ScreenName.AdminReports]: undefined;
  [ScreenName.Profile]:
    | {
        userId?: string;
      }
    | undefined;
  [ScreenName.Community]: { id: string };
  [ScreenName.UpdateCommunity]: { id: string };
  [ScreenName.UserConnections]: {
    userId: string;
    type: "followers" | "following";
  };
  [ScreenName.Post]: { id: string };
  [ScreenName.EditPost]: { id: string };
};
