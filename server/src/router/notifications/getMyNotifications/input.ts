import { z } from "zod";

export const zGetMyNotificationsTrpcInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
});
