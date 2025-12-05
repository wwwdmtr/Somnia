import { z } from "zod";

export const zCreateDreamTrpcInput = z.object({
  title: z
    .string({ message: "Title is required" })
    .trim()
    .min(1, "Title is required"),
  description: z.string({ message: "Description is required" }).trim(),
  text: z
    .string({ message: "Text is required" })
    .trim()
    .min(100, "Dream text should be at least 100 characters long"),
});
