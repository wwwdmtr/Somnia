export type SearchStackParamList = {
  Search: undefined;
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
