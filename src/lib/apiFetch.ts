const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? "";

/**
 * Wrapper around fetch that automatically attaches the x-api-key header.
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (API_KEY) {
    headers.set("x-api-key", API_KEY);
  }
  return fetch(input, { ...init, headers });
}
