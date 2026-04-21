import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetMyBlockedUsersTrpcInput } from "./input";

export const getMyBlockedUsersTrpcRoute = trpcLoggedProcedure
  .input(zGetMyBlockedUsersTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const search = input.search?.trim();

    const rawEntries = await ctx.prisma.userBlockedUser.findMany({
      where: {
        userId: ctx.me.id,
        ...(search
          ? {
              blockedUser: {
                OR: [
                  {
                    nickname: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            }
          : {}),
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
        createdAt: true,
        blockedUser: {
          select: {
            id: true,
            nickname: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (rawEntries.length > input.limit) {
      rawEntries.pop();
      nextCursor = rawEntries[rawEntries.length - 1]?.id ?? null;
    }

    return {
      items: rawEntries,
      nextCursor,
    };
  });
