export type UserPermission = "DELETE_POST" | "ALL" | "SUPER_ADMIN";

export type ClientMe = {
  id?: string;
  nickname?: string;
  name?: string | null;
  bio?: string | null;
  email?: string | null;
  avatar?: string | null;
  permissions?: UserPermission[];
} | null;
