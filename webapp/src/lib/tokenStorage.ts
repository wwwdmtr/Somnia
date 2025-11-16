import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "token";

const isWeb = Platform.OS === "web";

const getCookie = () => {
  if (typeof document === "undefined") {
    return undefined;
  }
  return document.cookie
    ?.split("; ")
    .find((row) => row.startsWith(`${TOKEN_KEY}=`))
    ?.split("=")[1];
};

export const getToken = async () => {
  if (isWeb) {
    return getCookie();
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const setToken = async (value: string) => {
  if (isWeb) {
    if (typeof document !== "undefined") {
      document.cookie = `${TOKEN_KEY}=${value}; path=/; sameSite=lax`;
    }
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, value);
};

export const clearToken = async () => {
  if (isWeb) {
    if (typeof document !== "undefined") {
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    }
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
