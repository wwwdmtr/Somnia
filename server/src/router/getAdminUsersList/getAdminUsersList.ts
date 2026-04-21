import { trpcLoggedProcedure } from "../../lib/trpc";
import { isSuperAdmin, isUserAdmin } from "../../utils/can";

import { zGetAdminUsersListTrpcInput } from "./input";

export const getAdminUsersListTrpcRoute = trpcLoggedProcedure
  .input(zGetAdminUsersListTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!isUserAdmin(ctx.me)) {
      throw new Error("Unauthorized");
    }

    const normalizedSearch = input.search?.trim();
    const whereConditions = [
      {
        id: {
          not: ctx.me!.id,
        },
      },
      ...(input.list === "ADMINS"
        ? [
            {
              OR: [
                {
                  permissions: {
                    has: "ALL" as const,
                  },
                },
                {
                  permissions: {
                    has: "SUPER_ADMIN" as const,
                  },
                },
              ],
            },
          ]
        : []),
      ...(normalizedSearch
        ? [
            {
              OR: [
                {
                  nickname: {
                    contains: normalizedSearch,
                    mode: "insensitive" as const,
                  },
                },
                {
                  name: {
                    contains: normalizedSearch,
                    mode: "insensitive" as const,
                  },
                },
              ],
            },
          ]
        : []),
    ];

    const rawUsers = await ctx.prisma.user.findMany({
      where: {
        AND: whereConditions,
      },
      take: input.limit + 1,
      ...(input.cursor
        ? {
            cursor: {
              id: input.cursor,
            },
            skip: 1,
          }
        : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        nickname: true,
        name: true,
        avatar: true,
        permissions: true,
      },
    });

    let nextCursor: string | null = null;
    if (rawUsers.length > input.limit) {
      rawUsers.pop();
      nextCursor = rawUsers[rawUsers.length - 1]?.id ?? null;
    }

    return {
      items: rawUsers.map((user) => ({
        id: user.id,
        nickname: user.nickname,
        name: user.name,
        avatar: user.avatar,
        isAdmin:
          user.permissions.includes("ALL") ||
          user.permissions.includes("SUPER_ADMIN"),
        isSuperAdmin: isSuperAdmin(user),
      })),
      nextCursor,
    };
  });
