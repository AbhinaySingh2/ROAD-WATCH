import { useState, useEffect } from "react";

export class ApiError extends Error {
  constructor(msg: string, public status: number, public body: unknown) { super(msg); this.name = "ApiError"; }
}

const BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export async function apiFetch<T>(path: string, init?: RequestInit & { timeoutMs?: number }): Promise<T> {
  const { timeoutMs = 60000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path.startsWith("/") ? path : `/${path}`}`, { ...rest, signal: controller.signal });
    const ct = res.headers.get("content-type") ?? "";
    const body = ct.includes("application/json") ? await res.json().catch(() => null) : await res.text().catch(() => "");
    if (!res.ok) throw new ApiError(typeof body === "object" && body && "detail" in (body as any) ? String((body as any).detail) : `Request failed (${res.status})`, res.status, body);
    return body as T;
  } finally { clearTimeout(timeout); }
}

let cache: any[] | null = null, cacheTime = 0, fetchPromise: Promise<any> | null = null;

export function useRoadIssues(forceRefresh = false) {
  const [data, setData] = useState<any[]>(cache || []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = Date.now();
    if (!forceRefresh && cache && now - cacheTime < 15000) { setData(cache); setLoading(false); return; }
    if (fetchPromise && !forceRefresh) { fetchPromise.then(setData).catch(err => setError(err.message)).finally(() => setLoading(false)); return; }
    setLoading(true);
    fetchPromise = apiFetch<any[]>("/api/v1/issues")
      .then(res => { cache = res; cacheTime = Date.now(); setData(res); fetchPromise = null; return res; })
      .catch(err => { if (err.name !== "AbortError") setError(err.message || "Fetch failed"); fetchPromise = null; })
      .finally(() => setLoading(false));
  }, [forceRefresh]);

  return { data, loading, error, refresh: () => { cache = null; fetchPromise = null; } };
}
