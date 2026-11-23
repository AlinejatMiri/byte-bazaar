const configuredBase = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
export const API_BASE_URL = (configuredBase || "http://localhost:8080/api").replace(/\/$/, "");

export type ApiErrorBody = {
  status?: number;
  error?: string;
  message?: string;
  detail?: string;
  path?: string;
  timestamp?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function expireSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("byteforge-token");
  localStorage.removeItem("byteforge-role");
  window.dispatchEvent(new Event("auth:expired"));
  if (window.location.pathname !== "/login") window.location.assign("/login");
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; etag?: string }> {
  const headers = new Headers(init.headers);
  const token = typeof window === "undefined" ? null : localStorage.getItem("byteforge-token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    let body: ApiErrorBody | undefined;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = undefined;
    }
    if (response.status === 401) expireSession();
    throw new ApiError(
      body?.message || body?.detail || body?.error || `Request failed (${response.status})`,
      response.status,
    );
  }

  const data = response.status === 204 ? undefined : await response.json();
  const etag = response.headers.get("ETag");
  return { data: data as T, ...(etag ? { etag } : {}) };
}

export function checkoutKey() {
  return crypto.randomUUID();
}
