import { z } from "zod";

export const zSetUserAdminTrpcInput = z.object({
  userId: z.string().trim().min(1),
  isAdmin: z.boolean(),
});

export type SetUserAdminTrpcInput = z.infer<typeof zSetUserAdminTrpcInput>;
