export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, "") ||
  "";

type ApiTokenGetter = () => Promise<string | null>;

let apiAuthTokenGetter: ApiTokenGetter | null = null;

export function setApiAuthTokenGetter(getter: ApiTokenGetter | null): void {
  apiAuthTokenGetter = getter;
}

export async function getApiAuthToken(): Promise<string | null> {
  if (!apiAuthTokenGetter) return null;
  try {
    return await apiAuthTokenGetter();
  } catch {
    return null;
  }
}

export function getApiUrl(path: string): string {
  if (!API_BASE_URL || !path.startsWith("/")) return path;
  return `${API_BASE_URL}${path}`;
}
