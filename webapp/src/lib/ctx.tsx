import { createContext, useContext } from "react";

import { trpc } from "./trpc";

import type { ClientMe } from "@somnia/server/src/lib/models";

type GetMeError = ReturnType<typeof trpc.getMe.useQuery>["error"];

export type AppContext = {
  me: ClientMe;
  isLoading: boolean;
  isError: boolean;
  error: GetMeError | null;
};

const AppReactContext = createContext<AppContext>({
  me: null,
  isLoading: false,
  isError: false,
  error: null,
});

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data, error, isLoading, isError } = trpc.getMe.useQuery();

  return (
    <AppReactContext.Provider
      value={{
        me: data?.me || null,
        isLoading,
        isError,
        error: error ?? null,
      }}
    >
      {children}
    </AppReactContext.Provider>
  );
};

export const useAppContext = () => {
  return useContext(AppReactContext);
};

export const useMe = () => {
  const { me } = useAppContext();
  return me;
};
