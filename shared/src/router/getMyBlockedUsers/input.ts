import { z } from "zod";

export const zGetMyBlockedUsersTrpcInput = z.object({
  cursor: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).optional(),
});

export type GetMyBlockedUsersTrpcInput = z.infer<
  typeof zGetMyBlockedUsersTrpcInput
>;
