import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("authToken") : null;
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = typeof localStorage !== "undefined" ? localStorage.getItem("authToken") : null;
    const base = queryKey[0] as string;
    let url = base;

    // Support optional params in queryKey[1]
    if (queryKey.length > 1) {
      const params = queryKey[1] as any;
      if (params && typeof params === 'object') {
        const sp = new URLSearchParams();
        for (const k of Object.keys(params)) {
          const v = params[k];
          if (v !== undefined && v !== null) sp.append(k, String(v));
        }
        const queryString = sp.toString();
        if (queryString.length) url = `${base}?${queryString}`;
      } else if (params !== undefined) {
        // support boolean or primitive as includeArchived
        url = `${base}?includeArchived=${String(params)}`;
      }
    }

    const res = await fetch(url, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
