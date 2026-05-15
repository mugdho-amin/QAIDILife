import type { DataProvider } from "@refinedev/core";
import { readAdminToken } from "@/lib/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? "http://localhost:4000";

const buildHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = readAdminToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

const getErrorMessage = (body: string, status: number): string => {
  try {
    const parsed = JSON.parse(body);
    return parsed.error?.message ?? parsed.message ?? `API error (${status})`;
  } catch {
    return body || `API error (${status})`;
  }
};

const unwrap = (body: unknown) => {
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as any).data;
  }
  return body;
};

const apiFetch = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...buildHeaders(), ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`API Error [${response.status}] ${path}:`, body.slice(0, 500));
    const message = getErrorMessage(body, response.status);
    throw { message, status: response.status };
  }
  if (response.status === 204) return undefined as T;
  const body = await response.json();
  return unwrap(body) as T;
};

export const dataProvider: DataProvider = {
  custom: async ({ url, method, payload, headers, query }: any) => {
    const queryString = query ? `?${new URLSearchParams(query).toString()}` : "";
    const response = await fetch(`${API_BASE}${url}${queryString}`, {
      method: method ?? "GET",
      headers: { ...buildHeaders(), ...(headers ?? {}) },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      const message = getErrorMessage(body, response.status);
      throw { message, status: response.status };
    }
    const body = await response.json() as any;
    const data = unwrap(body);
    return { data };
  },

  getList: async ({ resource, pagination, sorters, filters }: any) => {
    const params: Record<string, unknown> = {};
    if (pagination) {
      params.page = pagination.currentPage ?? 1;
      params.limit = pagination.pageSize ?? 20;
    }
    if (sorters?.length) {
      params.sort = sorters.map((s: any) => `${s.field}:${s.order}`).join(",");
    }
    if (filters?.length) {
      filters.forEach((f: any) => {
        if ("field" in f && f.value !== undefined) {
          params[f.field] = f.value;
        }
      });
    }
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ),
    ).toString();
    const path = query ? `/v1/admin/${resource}?${query}` : `/v1/admin/${resource}`;

    const result = await apiFetch<any>(path);
    if (result && typeof result === "object" && "data" in result && Array.isArray(result.data)) {
      return { data: result.data, total: result.total ?? result.data.length };
    }
    const arr = result as any[];
    return { data: arr ?? [], total: arr?.length ?? 0 };
  },

  getMany: async ({ resource, ids }: any) => {
    const results = await Promise.all(
      ids.map((id: string) => apiFetch(`/v1/admin/${resource}/${id}`)),
    );
    return { data: results as any[] };
  },

  getOne: async ({ resource, id }: any) => {
    const data = await apiFetch(`/v1/admin/${resource}/${id}`);
    return { data: data as any };
  },

  create: async ({ resource, variables }: any) => {
    const data = await apiFetch(`/v1/admin/${resource}`, {
      method: "POST",
      body: JSON.stringify(variables),
    });
    return { data: data as any };
  },

  update: async ({ resource, id, variables }: any) => {
    const data = await apiFetch(`/v1/admin/${resource}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(variables),
    });
    return { data: data as any };
  },

  deleteOne: async ({ resource, id }: any) => {
    await apiFetch(`/v1/admin/${resource}/${id}`, { method: "DELETE" });
    return { data: { id } as any };
  },

  getApiUrl: () => `${API_BASE}/v1/admin`,
};
