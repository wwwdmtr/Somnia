import { TrpcRouter } from "@somnia/server/src/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, type TRPCLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";
import superjson from "superjson";

import { env } from "./env";
import { sentryCaptureException } from "./sentrySDK";
import { getToken } from "./tokenStorage";

import type { AppRouter as ServerAppRouter } from "@somnia/server/src/router-types";

type AppRouter = Omit<ServerAppRouter, "_def"> & {
  _def: Omit<ServerAppRouter["_def"], "_config"> & {
    _config: Omit<ServerAppRouter["_def"]["_config"], "$types"> & {
      $types: Omit<
        ServerAppRouter["_def"]["_config"]["$types"],
        "transformer"
      > & { transformer: true };
    };
  };
};

export const trpc = createTRPCReact<AppRouter>();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const customTrpcLink: TRPCLink<TrpcRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(error) {
          if (env.NODE_ENV !== "development") {
            console.error(error);
          }
          sentryCaptureException(error);
          observer.error(error);
        },
        complete() {
          observer.complete();
        },
      });
      return unsubscribe;
    });
  };
};

const trpcClient = trpc.createClient({
  links: [
    customTrpcLink,
    httpBatchLink({
      url: env.BACKEND_TRPC_URL,
      transformer: superjson,

      async fetch(url, options) {
        const token = await getToken();

        return fetch(url, {
          ...options,
          headers: {
            ...(options?.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      },
    }),
  ],
});

export const TrpcProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
};
