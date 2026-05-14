/** Read the admin token from local storage. */
export const readAdminToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem("qaidilife:admin_token");
};

/** Store the admin token in local storage. */
export const storeAdminToken = (token: string): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem("qaidilife:admin_token", token);
};

/** Remove the admin token from local storage. */
export const clearAdminToken = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem("qaidilife:admin_token");
};
