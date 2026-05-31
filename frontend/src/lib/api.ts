import { useState, useEffect } from "react";

export class ApiError extends Error {
  constructor(
    msg: string,
    public status: number,
    public body: unknown,
  ) {
    super(msg);
    this.name = "ApiError";
  }
}

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export async function apiFetch<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 60000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path.startsWith("/") ? path : `/${path}`}`, {
      ...rest,
      signal: controller.signal,
    });
    const ct = res.headers.get("content-type") ?? "";
    const body = ct.includes("application/json")
      ? await res.json().catch(() => null)
      : await res.text().catch(() => "");
    if (!res.ok)
      throw new ApiError(
        typeof body === "object" && body && "detail" in (body as any)
          ? String((body as any).detail)
          : `Request failed (${res.status})`,
        res.status,
        body,
      );
    return body as T;
  } finally {
    clearTimeout(timeout);
  }
}

let cache: Record<string, any> = {},
  cacheTime: Record<string, number> = {},
  fetchPromises: Record<string, Promise<any> | undefined> = {};

export function useRoadIssues(options?: {
  forceRefresh?: boolean;
  skip?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}) {
  const { forceRefresh = false, skip = 0, limit = 1000, sortBy = "id", sortOrder = "desc" } = options || {};
  const cacheKey = `${skip}-${limit}-${sortBy}-${sortOrder}`;

  const [data, setData] = useState<any[]>(cache[cacheKey] || []);
  const [loading, setLoading] = useState(!cache[cacheKey]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    if (!forceRefresh && cache[cacheKey] && now - (cacheTime[cacheKey] || 0) < 15000) {
      setData(cache[cacheKey]);
      setLoading(false);
      return;
    }
    if (fetchPromises[cacheKey] && !forceRefresh) {
      fetchPromises[cacheKey]
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    fetchPromises[cacheKey] = apiFetch<any[]>(
      `/api/v1/issues?skip=${skip}&limit=${limit}&sort_by=${sortBy}&sort_order=${sortOrder}`,
    )
      .then((res) => {
        cache[cacheKey] = res;
        cacheTime[cacheKey] = Date.now();
        setData(res);
        delete fetchPromises[cacheKey];
        return res;
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message || "Fetch failed");
        delete fetchPromises[cacheKey];
      })
      .finally(() => setLoading(false));
  }, [forceRefresh, skip, limit, sortBy, sortOrder, cacheKey]);

  return {
    data,
    loading,
    error,
    refresh: () => {
      delete cache[cacheKey];
      delete fetchPromises[cacheKey];
    },
  };
}
