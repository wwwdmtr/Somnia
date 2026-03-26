import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, type TRPCLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { observable } from "@trpc/server/observable";

import { env } from "./env";
import { sentryCaptureException } from "./sentrySDK";
import { getToken } from "./tokenStorage";

import type { AppRouter as ServerAppRouter } from "@somnia/shared/src/router-types";

type AppRouter = Omit<ServerAppRouter, "_def"> & {
  _def: Omit<ServerAppRouter["_def"], "_config"> & {
    _config: Omit<ServerAppRouter["_def"]["_config"], "$types"> & {
      $types: Omit<
        ServerAppRouter["_def"]["_config"]["$types"],
        "transformer" | "errorShape"
      > & {
        transformer: true;
        errorShape: ServerAppRouter["_def"]["_config"]["$types"]["errorShape"] & {
          data: ServerAppRouter["_def"]["_config"]["$types"]["errorShape"]["data"] & {
            isExpected?: boolean;
          };
        };
      };
    };
  };
};

const jsonTransformer = {
  input: {
    serialize: (obj: unknown) => obj,
    deserialize: (obj: unknown) => obj,
  },
  output: {
    serialize: (obj: unknown) => obj,
    deserialize: (obj: unknown) => obj,
  },
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

const customTrpcLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(error) {
          if (!error.data?.isExpected) {
            if (env.NODE_ENV !== "development") {
              console.error(error);
            }
            sentryCaptureException(error);
          }

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
      transformer: jsonTransformer,

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
