import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import * as SecureStore from 'expo-secure-store';
import superjson from 'superjson';

import type { AppRouter as ServerAppRouter } from '@somnia/server/src/router-types';

type AppRouter = Omit<ServerAppRouter, '_def'> & {
  _def: Omit<ServerAppRouter['_def'], '_config'> & {
    _config: Omit<ServerAppRouter['_def']['_config'], '$types'> & {
      $types: Omit<
        ServerAppRouter['_def']['_config']['$types'],
        'transformer'
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

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      transformer: superjson,

      async fetch(url, options) {
        const token = await SecureStore.getItemAsync('token');

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
