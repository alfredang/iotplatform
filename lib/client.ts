"use client";

/** Thin fetch wrapper for client components. Throws on non-2xx with the
 * server's error message when present. */
export async function apiFetch<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

/** SWR fetcher. Returns `any` so callers can apply their own generic type to
 * useSWR without a fetcher/return-type mismatch. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetcher = (url: string): Promise<any> => apiFetch(url);
