import { describe, expect, it } from "@jest/globals";

import {
  canDeletePost,
  canDeleteThisPost,
  isPostOwner,
  isSuperAdmin,
  isUserAdmin,
} from "./can";

import type { UserPermission } from "@prisma/client";

const user = (overrides?: {
  id?: string;
  permissions?: UserPermission[];
}): { id?: string; permissions?: UserPermission[] } => ({
  id: "user-1",
  permissions: [],
  ...overrides,
});

const post = (overrides?: { authorId?: string }): { authorId?: string } => ({
  authorId: "user-2",
  ...overrides,
});

describe("can utils", () => {
  describe("canDeletePost", () => {
    it("returns false for null user", () => {
      expect(canDeletePost(null)).toBe(false);
    });

    it("returns false when user has no permissions", () => {
      expect(canDeletePost({ id: "user-1" })).toBe(false);
    });

    it("returns true when user has DELETE_POST permission", () => {
      expect(canDeletePost(user({ permissions: ["DELETE_POST"] }))).toBe(true);
    });

    it("returns true when user has ALL permission", () => {
      expect(canDeletePost(user({ permissions: ["ALL"] }))).toBe(true);
    });

    it("returns true when user has SUPER_ADMIN permission", () => {
      expect(canDeletePost(user({ permissions: ["SUPER_ADMIN"] }))).toBe(true);
    });

    it("returns false when user permissions are empty", () => {
      expect(canDeletePost(user({ permissions: [] }))).toBe(false);
    });
  });

  describe("isPostOwner", () => {
    it("returns true when user id equals post authorId", () => {
      expect(
        isPostOwner(user({ id: "owner-id" }), post({ authorId: "owner-id" })),
      ).toBe(true);
    });

    it("returns false when user id differs from post authorId", () => {
      expect(
        isPostOwner(user({ id: "user-id" }), post({ authorId: "author-id" })),
      ).toBe(false);
    });

    it("returns false for missing user id", () => {
      expect(isPostOwner({ permissions: [] }, post())).toBe(false);
    });

    it("returns false for missing post authorId", () => {
      expect(isPostOwner(user(), {})).toBe(false);
    });

    it("returns false when user or post is null", () => {
      expect(isPostOwner(null, post())).toBe(false);
      expect(isPostOwner(user(), null)).toBe(false);
    });
  });

  describe("isUserAdmin", () => {
    it("returns true for ALL and SUPER_ADMIN permissions", () => {
      expect(isUserAdmin(user({ permissions: ["ALL"] }))).toBe(true);
      expect(isUserAdmin(user({ permissions: ["SUPER_ADMIN"] }))).toBe(true);
      expect(isUserAdmin(user({ permissions: ["DELETE_POST"] }))).toBe(false);
    });
  });

  describe("isSuperAdmin", () => {
    it("returns true only for SUPER_ADMIN permission", () => {
      expect(isSuperAdmin(user({ permissions: ["SUPER_ADMIN"] }))).toBe(true);
      expect(isSuperAdmin(user({ permissions: ["ALL"] }))).toBe(false);
      expect(isSuperAdmin(user({ permissions: ["DELETE_POST"] }))).toBe(false);
    });
  });

  describe("canDeleteThisPost", () => {
    it("returns true when user can delete any post", () => {
      expect(
        canDeleteThisPost(
          user({ permissions: ["DELETE_POST"] }),
          post({ authorId: "another-user" }),
        ),
      ).toBe(true);
    });

    it("returns true when user owns the post", () => {
      expect(
        canDeleteThisPost(
          user({ id: "owner-id", permissions: [] }),
          post({ authorId: "owner-id" }),
        ),
      ).toBe(true);
    });

    it("returns false when user has no permission and is not owner", () => {
      expect(
        canDeleteThisPost(
          user({ id: "user-id", permissions: [] }),
          post({ authorId: "author-id" }),
        ),
      ).toBe(false);
    });
  });
});
