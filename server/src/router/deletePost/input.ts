import { z } from "zod";

export const zDeletePostTrpcInput = z.object({
  postId: z.string({ message: "postId обязателен" }),
});
