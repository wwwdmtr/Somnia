import express from "express";

import { applyTrpcToExpressApp } from "./lib/trpc";
import { trpcRouter } from "./router/index";

const expressApp = express();

applyTrpcToExpressApp(expressApp, trpcRouter);

expressApp.listen(3000, () => {
  console.info("Server is running on http://localhost:3000");
});
