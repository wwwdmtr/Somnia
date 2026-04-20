import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSearchUsersTrpcInput } from "./input";

export const searchUsersTrpcRoute = trpcLoggedProcedure
  .input(zSearchUsersTrpcInput)
  .query(async ({ ctx, input }) => {
    const normalizedSearch = input.search.trim();
    if (!normalizedSearch) {
      return { users: [] };
    }

    const users = await ctx.prisma.user.findMany({
      where: {
        OR: [
          {
            nickname: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: normalizedSearch,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        nickname: "asc",
      },
      select: {
        id: true,
        nickname: true,
        name: true,
        avatar: true,
      },
      take: input.limit,
    });

    return { users };
  });
