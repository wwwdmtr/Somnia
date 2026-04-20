export type ProfileStackParamList = {
  Profile:
    | {
        userId?: string;
      }
    | undefined;
  SignOut: undefined;
  UpdateProfile: undefined;
  Community: { id: string };
  UpdateCommunity: { id: string };
  UserConnections: {
    userId: string;
    type: "followers" | "following";
  };
  Post: { id: string };
  EditPost: { id: string };
};
