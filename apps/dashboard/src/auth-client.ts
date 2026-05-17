import { useEffect, useState } from "react";

// Same-origin in prod; Vite proxies /api to the server in dev.

export interface AuthUser {
  id: string;
  email: string;
}

export async function login(
  email: string,
  password: string,
): Promise<{ error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return {};
  const body = await res.json().catch(() => ({}));
  return { error: (body as { error?: string }).error ?? "Authentication failed" };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function fetchSession(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  if (!res.ok) return null;
  const body = (await res.json()) as { user: AuthUser };
  return body.user;
}

/** Mirrors the old better-auth useSession() shape the app expects. */
export function useSession(): { data: AuthUser | null; isPending: boolean } {
  const [data, setData] = useState<AuthUser | null>(null);
  const [isPending, setIsPending] = useState(true);
  useEffect(() => {
    let alive = true;
    fetchSession().then((user) => {
      if (!alive) return;
      setData(user);
      setIsPending(false);
    });
    return () => {
      alive = false;
    };
  }, []);
  return { data, isPending };
}
