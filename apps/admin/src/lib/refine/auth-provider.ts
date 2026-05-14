import type { AuthProvider } from "@refinedev/core";
import { loginAdmin, fetchAdminMe } from "@/lib/api";
import { readAdminToken, storeAdminToken, clearAdminToken } from "@/lib/auth";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const session = await loginAdmin(email as string, password as string);
    storeAdminToken(session.token);
    return { success: true, redirectTo: "/" };
  },

  logout: async () => {
    clearAdminToken();
    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    const token = readAdminToken();
    if (token) {
      return { authenticated: true };
    }
    return { authenticated: false, redirectTo: "/login" };
  },

  getPermissions: async () => {
    const token = readAdminToken();
    if (!token) return null;
    try {
      const admin = await fetchAdminMe();
      return admin.role;
    } catch {
      return null;
    }
  },

  getIdentity: async () => {
    const token = readAdminToken();
    if (!token) return null;
    try {
      const admin = await fetchAdminMe();
      return {
        id: admin.id,
        name: admin.name ?? admin.email,
        email: admin.email,
        role: admin.role,
      };
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    if (error?.status === 401) {
      clearAdminToken();
      return { logout: true, redirectTo: "/login" };
    }
    return {};
  },
};
