import express from "express";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import { trpcRouter } from "./trpc";

const expressApp = express();


expressApp.use("/trpc",
    trpcExpress.createExpressMiddleware({
        router: trpcRouter,
    }));

expressApp.listen(3000, () => { 
    console.log("Server is running on http://localhost:3000");
})
