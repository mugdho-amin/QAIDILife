import { createApiClient } from "@qaidilife/api-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

let clientInstance: ReturnType<typeof createApiClient> | null = null;

/** Read the auth token from local storage. */
const readToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("qaidilife:token");
};

/** Read the cart id from local storage. */
const readCartId = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("qaidilife:cart_id");
};

/** Persist the cart id to local storage. */
const writeCartId = (cartId: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("qaidilife:cart_id", cartId);
};

/** Persist the auth token to local storage. */
export const storeToken = (token: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("qaidilife:token", token);
};

/** Build a singleton API client for browser usage. */
export const getApiClient = () => {
  if (!clientInstance) {
    clientInstance = createApiClient({
      baseUrl: API_BASE_URL,
      getToken: readToken,
      getCartId: readCartId,
      setCartId: writeCartId,
    });
  }
  return clientInstance;
};

/** Convert query params to a URLSearchParams string. */
export const buildQueryString = (
  query: Record<string, string | number>,
): string => {
  const params = new URLSearchParams();
  for (const key of Object.keys(query)) {
    params.set(key, String(query[key]));
  }
  return params.toString();
};
