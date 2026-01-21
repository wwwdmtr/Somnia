import { z } from "zod";

export const zCreateCommentTrpcInput = z.object({
  postId: z.string(),
  content: z
    .string({ message: "Комментарий не может быть пустым" })
    .trim()
    .min(1, "Комментарий не может быть пустым")
    .max(2000, "Комментарий слишком длинный"),

  parentId: z.string().optional(),
});
