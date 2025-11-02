import { dreams } from "../../lib/dreams";
import { trpc } from "../../lib/trpc";

import { zCreateDreamTrpcInput } from "./input";

let lastId = dreams.at(-1)?.id ?? 0;

export const createDreamTrpcRoute = trpc.procedure
  .input(zCreateDreamTrpcInput)
  .mutation(({ input }) => {
    lastId += 1;

    const newDream = {
      id: lastId,
      nickname: `user${lastId}`,
      title: input.title,
      description: input.description,
      text: input.text,
    };

    dreams.unshift(newDream);

    return true;
  });
