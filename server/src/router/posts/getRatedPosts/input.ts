import { z } from "zod";

export const zGetRatedPostsTrpcInput = z.object({
  cursor: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(50).default(10),
  period: z.enum(["day", "week", "month", "all"]).default("week"),
  search: z.string().trim().max(100).optional(),
});

export type GetRatedPostsTrpcInput = z.infer<typeof zGetRatedPostsTrpcInput>;
