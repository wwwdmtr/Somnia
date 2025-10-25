import { initTRPC } from '@trpc/server';
import _ from 'lodash';
import { z } from 'zod';

const dreams = _.times(100, (i) => ({
  id: i + 1,
  nickname: `user${i + 1}`,
  title: `Dream${i + 1}`,
  description: `I dreamed about some interesting number ${i + 1}.`,
  text: `This is a detailed description of dream number ${i + 1}. It was a fascinating experience that left a lasting impression on me. I can't wait to explore more dreams like this in the future!`,
}));

const trpc = initTRPC.create();

export const trpcRouter = trpc.router({
  getDreams: trpc.procedure.query(() => {
    return { dreams };
  }),
  getDream: trpc.procedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .query(({ input }) => {
      const dream = dreams.find((dream) => dream.id === input.id);
      return { dream: dream || null };
    }),
});

export type trpcRouter = typeof trpcRouter;
