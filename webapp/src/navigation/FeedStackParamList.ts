export type FeedStackParamList = {
  Feed: undefined;
  Notifications: undefined;
  Profile: {
    userId?: string;
  };
  Community: { id: string };
  UpdateCommunity: { id: string };
  UserConnections: {
    userId: string;
    type: "followers" | "following";
  };
  Post: { id: string };
  EditPost: { id: string };
};
