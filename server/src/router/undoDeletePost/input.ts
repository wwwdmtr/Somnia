import { z } from "zod";

export const zUndoDeletePostTrpcInput = z.object({
  postId: z.string({ message: "postId обязателен" }),
});
