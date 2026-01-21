import { z } from "zod";

export const zDeleteCommentTrpcInput = z.object({
  commentId: z.string({ message: "commentId обязателен" }),
});
