import express from 'express';

import { AppContext, createAppContext } from './lib/ctx';
import { applyTrpcToExpressApp } from './lib/trpc';
import { trpcRouter } from './router/index';

void (async () => {
  let ctx: AppContext | null = null;
  try {
    ctx = createAppContext();
    const expressApp = express();

    applyTrpcToExpressApp(expressApp, ctx, trpcRouter);

    expressApp.listen(3000, () => {
      console.info('Server is running on http://localhost:3000');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await ctx?.stop();
  }
})();
