import { z } from "zod";

export const zSearchUsersTrpcInput = z.object({
  search: z.string().trim().max(100).default(""),
  limit: z.number().int().min(1).max(50).default(20),
});

export type SearchUsersTrpcInput = z.infer<typeof zSearchUsersTrpcInput>;
