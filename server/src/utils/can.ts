import type { UserPermission } from "@prisma/client";

type MaybeUser = {
  id?: string;
  permissions?: UserPermission[];
} | null;

type MaybePost = {
  authorId?: string;
} | null;

const hasPermission = (user: MaybeUser, permission: UserPermission) => {
  if (!user?.permissions) {
    return false;
  }

  return (
    user.permissions.includes(permission) ||
    user.permissions.includes("ALL") ||
    user.permissions.includes("SUPER_ADMIN")
  );
};

export const canDeletePost = (user: MaybeUser) => {
  return hasPermission(user, "DELETE_POST");
};

export const isPostOwner = (user: MaybeUser, post: MaybePost) => {
  if (!user?.id || !post?.authorId) {
    return false;
  }
  return user.id === post.authorId;
};

export const isUserAdmin = (user: MaybeUser) => {
  return hasPermission(user, "ALL");
};

export const isSuperAdmin = (user: MaybeUser) => {
  return Boolean(user?.permissions?.includes("SUPER_ADMIN"));
};

export const canDeleteThisPost = (user: MaybeUser, post: MaybePost) => {
  return canDeletePost(user) || isPostOwner(user, post);
};
