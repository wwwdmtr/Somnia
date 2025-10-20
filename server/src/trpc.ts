import { initTRPC } from "@trpc/server";

const dreams = [
  {
    nickname: "user1",
    title: "Dream1",
    description: "I dreamed about flying.",
  },
  {
    nickname: "user2",
    title: "Dream2",
    description: "I dreamed about swimming.",
  },
  {
    nickname: "user3",
    title: "Dream3",
    description: "I dreamed about running.",
  },
];

const trpc = initTRPC.create();

export const trpcRouter = trpc.router({
  getDreams: trpc.procedure.query(() => {
    return { dreams };
  }),
});

export type trpcRouter = typeof trpcRouter;
