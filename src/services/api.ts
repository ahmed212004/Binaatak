const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://localhost:64687/api"
).replace(/\/$/, "");

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/i, "");

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const encodedPath = normalizedPath
    .split("/")
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch {
        return encodeURIComponent(segment);
      }
    })
    .join("/");
  return `${SERVER_BASE_URL}${encodedPath}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers = new Headers(options.headers);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const parsed = JSON.parse(errorText);
      const validationDetails = parsed.errors
        ? Object.entries(parsed.errors)
            .map(
              ([field, msgs]: [string, any]) =>
                `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`
            )
            .join(" | ")
        : "";
      throw new Error(
        validationDetails ||
          parsed.message ||
          parsed.title ||
          `API Error: ${response.status}`
      );
    } catch (e: any) {
      if (e.message && !e.message.startsWith("Unexpected token")) throw e;
      throw new Error(errorText || `API Error: ${response.status}`);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}