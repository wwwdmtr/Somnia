export type UserPermission = "DELETE_POST" | "ALL";

export type ClientMe = {
  id?: string;
  nickname?: string;
  name?: string | null;
  bio?: string | null;
  email?: string | null;
  permissions?: UserPermission[];
} | null;
