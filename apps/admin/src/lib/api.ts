import { readAdminToken } from "./auth";
import type {
  AdminCategory,
  AdminCategoryTreeNode,
  AdminMetrics,
  AdminOrder,
  AdminPayment,
  AdminProduct,
  AdminSession,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:4000";

/** Build headers for admin API calls. */
const buildHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = readAdminToken();
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return headers;
};

/** Perform a JSON fetch against the admin API. */
const adminFetch = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(),
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let message: string;
    try {
      const parsed = JSON.parse(body);
      message = parsed.error?.message ?? parsed.message ?? `Admin API error (${response.status})`;
    } catch {
      message = body || `Admin API error (${response.status})`;
    }
    throw new Error(message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const body = await response.json();
  return (body?.data ?? body) as T;
};

/** Authenticate an admin user. */
export const loginAdmin = async (email: string, password: string) => {
  return adminFetch<AdminSession>("/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

/** Fetch the current admin profile. */
export const fetchAdminMe = async () => {
  return adminFetch<AdminSession["admin"]>("/v1/admin/auth/me");
};

/** Fetch dashboard metrics. */
export const fetchAdminMetrics = async () => {
  return adminFetch<AdminMetrics>("/v1/admin/metrics");
};

/** Fetch products. */
export const fetchProducts = async () => {
  return adminFetch<AdminProduct[]>("/v1/admin/catalog/products");
};

/** Fetch a single product. */
export const fetchProduct = async (id: string) => {
  return adminFetch<AdminProduct>(`/v1/admin/catalog/products/${id}`);
};

/** Create a new product. */
export const createProduct = async (payload: Partial<AdminProduct>) => {
  return adminFetch<AdminProduct>("/v1/admin/catalog/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/** Update a product. */
export const updateProduct = async (
  id: string,
  payload: Partial<AdminProduct>,
) => {
  return adminFetch<AdminProduct>(`/v1/admin/catalog/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/** Delete a product. */
export const deleteProduct = async (id: string) => {
  return adminFetch<void>(`/v1/admin/catalog/products/${id}`, {
    method: "DELETE",
  });
};

// ── Categories ────────────────────────────────────────────

/** Fetch categories with optional search, filter, pagination. */
export const fetchCategories = async (params?: {
  search?: string;
  status?: string;
  featured?: string;
  page?: number;
  limit?: number;
  sort?: string;
  parentId?: string;
}) => {
  const query = params
    ? "?" + new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ),
      ).toString()
    : "";
  return adminFetch<{ data: AdminCategory[]; total: number; page: number; limit: number; totalPages: number }>(
    `/v1/admin/catalog/categories${query}`,
  );
};

/** Fetch category tree (hierarchical). */
export const fetchCategoryTree = async () => {
  return adminFetch<AdminCategoryTreeNode[]>("/v1/admin/catalog/categories/tree");
};

/** Fetch single category. */
export const fetchCategory = async (id: string) => {
  return adminFetch<AdminCategory>(`/v1/admin/catalog/categories/${id}`);
};

/** Create a category. */
export const createCategory = async (payload: Partial<AdminCategory>) => {
  return adminFetch<AdminCategory>("/v1/admin/catalog/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/** Update a category. */
export const updateCategory = async (
  id: string,
  payload: Partial<AdminCategory>,
) => {
  return adminFetch<AdminCategory>(`/v1/admin/catalog/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

/** Reorder categories. */
export const reorderCategories = async (orders: Array<{ id: string; order: number }>) => {
  return adminFetch<{ success: boolean }>("/v1/admin/catalog/categories/reorder", {
    method: "PATCH",
    body: JSON.stringify({ orders }),
  });
};

/** Toggle category status. */
export const toggleCategoryStatus = async (id: string, status: string) => {
  return adminFetch<AdminCategory>(`/v1/admin/catalog/categories/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

/** Delete a category. */
export const deleteCategory = async (id: string) => {
  return adminFetch<void>(`/v1/admin/catalog/categories/${id}`, {
    method: "DELETE",
  });
};

/** Bulk delete categories. */
export const bulkDeleteCategories = async (ids: string[]) => {
  return adminFetch<{ deleted: number; errors: string[] }>(
    "/v1/admin/catalog/categories/bulk-delete",
    {
      method: "POST",
      body: JSON.stringify({ ids }),
    },
  );
};

/** Fetch orders. */
export const fetchOrders = async () => {
  return adminFetch<AdminOrder[]>("/v1/admin/orders");
};

/** Fetch order detail. */
export const fetchOrder = async (id: string) => {
  return adminFetch<AdminOrder>(`/v1/admin/orders/${id}`);
};

/** Update order status. */
export const updateOrderStatus = async (id: string, status: string) => {
  return adminFetch<AdminOrder>(`/v1/admin/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

/** Fetch payments. */
export const fetchPayments = async () => {
  return adminFetch<AdminPayment[]>("/v1/admin/payments");
};

/** Fetch payment detail. */
export const fetchPayment = async (id: string) => {
  return adminFetch<AdminPayment>(`/v1/admin/payments/${id}`);
};
