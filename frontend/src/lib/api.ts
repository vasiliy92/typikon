import useSWR from "swr";

const API_BASE = "/api/v1";

// ── Fetch helpers ──

async function fetchApi<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

// ── SWR fetcher ──

const swrFetcher = (url: string) => fetchApi(url);

export function useApi<T = unknown>(path: string) {
  return useSWR<T>(path, swrFetcher);
}

// ── Imperative helpers ──

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return fetchApi<T>(path, { method: "GET" });
}

export async function apiPost<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  return fetchApi<T>(path, { method: "POST", ...init });
}

export async function apiPut<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  return fetchApi<T>(path, { method: "PUT", ...init });
}

export async function apiPatch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  return fetchApi<T>(path, { method: "PATCH", ...init });
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  return fetchApi<T>(path, { method: "DELETE" });
}
