import { trpc } from "../lib/trpc";

export const getPostsTrpcRoute = trpc.procedure.query(async ({ ctx }) => {
  const posts = await ctx.prisma.post.findMany({
    select: {
      id: true,
      title: true,
      author: { select: { nickname: true } },
      createdAt: true,
      text: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { posts };
});
