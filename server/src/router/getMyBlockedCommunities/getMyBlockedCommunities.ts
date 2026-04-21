import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetMyBlockedCommunitiesTrpcInput } from "./input";

export const getMyBlockedCommunitiesTrpcRoute = trpcLoggedProcedure
  .input(zGetMyBlockedCommunitiesTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const search = input.search?.trim();

    const rawEntries = await ctx.prisma.userBlockedCommunity.findMany({
      where: {
        userId: ctx.me.id,
        ...(search
          ? {
              community: {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
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
        community: {
          select: {
            id: true,
            name: true,
            description: true,
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
