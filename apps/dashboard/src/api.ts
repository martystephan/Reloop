async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export interface Project {
  id: string;
  name: string;
  created_at: number;
  feedback_count: number;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
}

export interface FeedbackItem {
  id: string;
  type: string;
  message: string;
  rating: number | null;
  url: string | null;
  user_meta: string | null;
  api_key_name: string | null;
  created_at: number;
}

export const api = {
  listProjects: () =>
    request<{ projects: Project[] }>("/projects").then((r) => r.projects),
  createProject: (name: string) =>
    request<{ project: Project }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    }).then((r) => r.project),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),

  listKeys: (projectId: string) =>
    request<{ keys: ApiKey[] }>(`/projects/${projectId}/keys`).then((r) => r.keys),
  createKey: (projectId: string, name: string) =>
    request<{ key: ApiKey; secret: string }>(`/projects/${projectId}/keys`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  revokeKey: (id: string) => request<void>(`/keys/${id}`, { method: "DELETE" }),

  listFeedback: (projectId: string, type?: string) =>
    request<{ items: FeedbackItem[]; total: number }>(
      `/projects/${projectId}/feedback${type ? `?type=${type}` : ""}`,
    ),
};
