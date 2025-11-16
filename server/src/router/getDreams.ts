import { trpc } from "../lib/trpc";

export const getDreamsTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const dreams = await ctx.prisma.dream.findMany({
    select: {
      id: true,
      title: true,
      author: { select: { nickname: true } },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { dreams };
});
