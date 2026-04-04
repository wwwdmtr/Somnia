import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "token";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const isWeb = Platform.OS === "web";

const getCookie = () => {
  if (typeof document === "undefined") {
    return undefined;
  }
  const value = document.cookie
    ?.split("; ")
    .find((row) => row.startsWith(`${TOKEN_KEY}=`))
    ?.split("=")[1];

  return value ? decodeURIComponent(value) : undefined;
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
      const secureAttr =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "; Secure"
          : "";
      document.cookie = `${TOKEN_KEY}=${encodeURIComponent(value)}; Path=/; Max-Age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax${secureAttr}`;
    }
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, value);
};

export const clearToken = async () => {
  if (isWeb) {
    if (typeof document !== "undefined") {
      const secureAttr =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "; Secure"
          : "";
      document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax${secureAttr}`;
    }
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
};
