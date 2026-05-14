import type { paths } from './schema.d.ts';

/** API client configuration. */
export interface ApiClientOptions {
  /** Base URL for the API. */
  baseUrl: string;
  /** Optional fetch implementation override. */
  fetcher?: typeof fetch;
  /** Optional auth token provider. */
  getToken?: () => string | null;
  /** Optional cart id provider. */
  getCartId?: () => string | null;
  /** Optional cart id setter. */
  setCartId?: (cartId: string) => void;
}

type JsonRequest<T> = T extends {
  requestBody: { content: { 'application/json': infer U } };
}
  ? U
  : never;

type JsonResponse<T> = T extends {
  responses: { 200: { content: { 'application/json': infer U } } };
}
  ? U
  : T extends { responses: { 204: unknown } }
  ? void
  : never;

type Operation<Path extends keyof paths, Method extends keyof paths[Path]> =
  paths[Path][Method];

/** Typed API client for QAIDILife. */
export const createApiClient = (options: ApiClientOptions) => {
  const fetcher = options.fetcher ?? fetch;

  /** Build request headers with auth and cart context. */
  const buildHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = options.getToken?.();
    const cartId = options.getCartId?.();
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    if (cartId) {
      (headers as Record<string, string>)['x-cart-id'] = cartId;
    }
    return headers;
  };

  /** Handle cart id header if present. */
  const captureCartId = (response: Response): void => {
    const cartId = response.headers.get('x-cart-id');
    if (cartId) {
      options.setCartId?.(cartId);
    }
  };

  /** Request OTP for phone login. */
  const requestOtp = async (
    body: JsonRequest<Operation<'/v1/auth/otp/request', 'post'>>,
  ): Promise<JsonResponse<Operation<'/v1/auth/otp/request', 'post'>>> => {
    const response = await fetcher(`${options.baseUrl}/v1/auth/otp/request`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return (await response.json()) as JsonResponse<
      Operation<'/v1/auth/otp/request', 'post'>
    >;
  };

  /** Verify OTP and receive auth session. */
  const verifyOtp = async (
    body: JsonRequest<Operation<'/v1/auth/otp/verify', 'post'>>,
  ): Promise<JsonResponse<Operation<'/v1/auth/otp/verify', 'post'>>> => {
    const response = await fetcher(`${options.baseUrl}/v1/auth/otp/verify`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return (await response.json()) as JsonResponse<
      Operation<'/v1/auth/otp/verify', 'post'>
    >;
  };

  /** Fetch authenticated user profile. */
  const getMe = async (): Promise<JsonResponse<Operation<'/v1/me', 'get'>>> => {
    const response = await fetcher(`${options.baseUrl}/v1/me`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    return (await response.json()) as JsonResponse<Operation<'/v1/me', 'get'>>;
  };

  /** Logout the current session. */
  const logout = async (): Promise<void> => {
    const response = await fetcher(`${options.baseUrl}/v1/auth/logout`, {
      method: 'POST',
      headers: buildHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to logout');
    }
  };

  /** Fetch categories. */
  const listCategories = async (): Promise<
    JsonResponse<Operation<'/v1/categories', 'get'>>
  > => {
    const response = await fetcher(`${options.baseUrl}/v1/categories`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    return (await response.json()) as JsonResponse<
      Operation<'/v1/categories', 'get'>
    >;
  };

  /** Fetch products with optional query params. */
  const listProducts = async (query: Record<string, string | number> = {}) => {
    const params = new URLSearchParams();
    for (const key of Object.keys(query)) {
      params.set(key, String(query[key]));
    }
    const response = await fetcher(
      `${options.baseUrl}/v1/products?${params.toString()}`,
      { method: 'GET', headers: buildHeaders() },
    );
    return (await response.json()) as JsonResponse<
      Operation<'/v1/products', 'get'>
    >;
  };

  /** Fetch product detail. */
  const getProduct = async (id: string) => {
    const response = await fetcher(`${options.baseUrl}/v1/products/${id}`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    return (await response.json()) as JsonResponse<
      Operation<'/v1/products/{id}', 'get'>
    >;
  };

  /** Fetch current cart. */
  const getCart = async () => {
    const response = await fetcher(`${options.baseUrl}/v1/cart`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    captureCartId(response);
    return (await response.json()) as JsonResponse<
      Operation<'/v1/cart', 'get'>
    >;
  };

  /** Add item to cart. */
  const addCartItem = async (
    body: JsonRequest<Operation<'/v1/cart/items', 'post'>>,
  ) => {
    const response = await fetcher(`${options.baseUrl}/v1/cart/items`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    captureCartId(response);
    return (await response.json()) as JsonResponse<
      Operation<'/v1/cart/items', 'post'>
    >;
  };

  /** Update cart item quantity. */
  const updateCartItem = async (id: string, qty: number) => {
    const response = await fetcher(`${options.baseUrl}/v1/cart/items/${id}`, {
      method: 'PATCH',
      headers: buildHeaders(),
      body: JSON.stringify({ qty }),
    });
    captureCartId(response);
    return (await response.json()) as JsonResponse<
      Operation<'/v1/cart/items/{id}', 'patch'>
    >;
  };

  /** Remove cart item. */
  const removeCartItem = async (id: string): Promise<void> => {
    const response = await fetcher(`${options.baseUrl}/v1/cart/items/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(),
    });
    captureCartId(response);
    if (!response.ok) {
      throw new Error('Failed to remove cart item');
    }
  };

  /** Compute checkout totals. */
  const checkout = async (
    body: JsonRequest<Operation<'/v1/checkout', 'post'>>,
  ) => {
    const response = await fetcher(`${options.baseUrl}/v1/checkout`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return (await response.json()) as JsonResponse<
      Operation<'/v1/checkout', 'post'>
    >;
  };

  /** Initiate payment session. */
  const createPayment = async (
    body: JsonRequest<Operation<'/v1/payments', 'post'>>,
  ) => {
    const response = await fetcher(`${options.baseUrl}/v1/payments`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body),
    });
    return (await response.json()) as JsonResponse<
      Operation<'/v1/payments', 'post'>
    >;
  };

  /** List orders for the current user. */
  const listOrders = async (): Promise<
    JsonResponse<Operation<'/v1/orders', 'get'>>
  > => {
    const response = await fetcher(`${options.baseUrl}/v1/orders`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    return (await response.json()) as JsonResponse<
      Operation<'/v1/orders', 'get'>
    >;
  };

  /** Fetch a single order by id. */
  const getOrder = async (
    id: string,
  ): Promise<JsonResponse<Operation<'/v1/orders/{id}', 'get'>>> => {
    const response = await fetcher(`${options.baseUrl}/v1/orders/${id}`, {
      method: 'GET',
      headers: buildHeaders(),
    });
    return (await response.json()) as JsonResponse<
      Operation<'/v1/orders/{id}', 'get'>
    >;
  };

  return {
    requestOtp,
    verifyOtp,
    getMe,
    logout,
    listCategories,
    listProducts,
    getProduct,
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    checkout,
    createPayment,
    listOrders,
    getOrder,
  };
};

export type { paths };
