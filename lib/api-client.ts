import * as SecureStore from "expo-secure-store";

const API_URL = "https://bills-api.z-innova.com";

const SECURE_KEY_ACCESS = "tecozam_access_token";
const SECURE_KEY_REFRESH = "tecozam_refresh_token";

// ─── Token helpers ────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEY_ACCESS);
}

async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_KEY_REFRESH);
}

export async function storeTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(SECURE_KEY_ACCESS, access),
    SecureStore.setItemAsync(SECURE_KEY_REFRESH, refresh),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(SECURE_KEY_ACCESS),
    SecureStore.deleteItemAsync(SECURE_KEY_REFRESH),
  ]);
}

// ─── Token refresh ────────────────────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  // Deduplicate concurrent refresh attempts
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = await getRefreshToken();
    if (!refresh) throw new ApiError(401, "No refresh token available");

    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      await clearTokens();
      throw new ApiError(401, "Session expired. Please log in again.");
    }

    const data = (await res.json()) as { access: string; refresh?: string };
    const newRefresh = data.refresh ?? refresh;

    await storeTokens(data.access, newRefresh);
    return data.access;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ─── Error type ───────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Core request executor ────────────────────────────────────────────────────

interface RequestOptions {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  body?: unknown;
  formData?: FormData;
  isRetry?: boolean;
}

async function request<T>(options: RequestOptions): Promise<T> {
  const { method, path, body, formData, isRetry = false } = options;

  const token = await getAccessToken();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let bodyPayload: BodyInit | undefined;
  if (formData) {
    // Let the runtime set Content-Type with the correct boundary
    bodyPayload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    bodyPayload = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: bodyPayload,
  });

  if (res.status === 401 && !isRetry) {
    // Attempt a single token refresh and retry
    const newToken = await refreshAccessToken();

    const retryHeaders: Record<string, string> = {
      Authorization: `Bearer ${newToken}`,
    };
    if (!formData && body !== undefined) {
      retryHeaders["Content-Type"] = "application/json";
    }

    const retryRes = await fetch(`${API_URL}${path}`, {
      method,
      headers: retryHeaders,
      body: bodyPayload,
    });

    if (!retryRes.ok) {
      const errorBody = await retryRes.json().catch(() => null);
      throw new ApiError(retryRes.status, `API error ${retryRes.status}`, errorBody);
    }

    return retryRes.json() as Promise<T>;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new ApiError(res.status, `API error ${res.status}`, errorBody);
  }

  // 204 No Content — return empty object
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// ─── Public API surface ───────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>({ method: "GET", path });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>({ method: "POST", path, body });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>({ method: "PATCH", path, body });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>({ method: "PUT", path, body });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>({ method: "DELETE", path });
  },

  upload<T>(path: string, formData: FormData): Promise<T> {
    return request<T>({ method: "POST", path, formData });
  },
};
