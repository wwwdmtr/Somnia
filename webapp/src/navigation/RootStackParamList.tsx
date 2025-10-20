type FeedScreenParams = undefined;
type Dream = {
  title: string;
  description: string;
};
type DreamScreenParams = Pick<Dream, "title" | "description">;

export type RootStackParamList = {
  Feed: FeedScreenParams;
  Dream: DreamScreenParams;
};
