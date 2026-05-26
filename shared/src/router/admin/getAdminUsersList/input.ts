import { z } from "zod";

export const zGetAdminUsersListTrpcInput = z.object({
  list: z.enum(["ADMINS", "USERS"]),
  cursor: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(50).optional(),
});

export type GetAdminUsersListTrpcInput = z.infer<
  typeof zGetAdminUsersListTrpcInput
>;
