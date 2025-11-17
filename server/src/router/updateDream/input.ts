import { z } from "zod";

import { zCreateDreamTrpcInput } from "../createDream/input";

export const zUpdateDreamTrpcInput = zCreateDreamTrpcInput.extend({
  dreamId: z.string().min(1),
});
