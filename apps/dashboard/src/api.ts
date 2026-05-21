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
  notification_service_count: number;
}

export interface NotificationService {
  id: string;
  name: string;
  type: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: number;
  smtp_user: string;
  smtp_pass: string;
  from_address: string;
  to_address: string;
  created_at: number;
}

export interface NotificationServiceInput {
  name: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_address: string;
  to_address: string;
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
  updateProject: (id: string, name: string) =>
    request<{ project: Project }>(`/projects/${id}`, {
      method: "PATCH",
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

  listNotificationServices: () =>
    request<{ services: NotificationService[] }>("/notification-services").then(
      (r) => r.services,
    ),
  createNotificationService: (data: NotificationServiceInput) =>
    request<{ service: NotificationService }>("/notification-services", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => r.service),
  updateNotificationService: (id: string, data: Partial<NotificationServiceInput>) =>
    request<{ service: NotificationService }>(`/notification-services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }).then((r) => r.service),
  deleteNotificationService: (id: string) =>
    request<void>(`/notification-services/${id}`, { method: "DELETE" }),
  testNotificationService: (data: NotificationServiceInput & { id?: string }) =>
    request<{ ok: boolean; error?: string }>("/notification-services/test", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProjectNotificationServices: (projectId: string) =>
    request<{ services: NotificationService[] }>(
      `/projects/${projectId}/notification-services`,
    ).then((r) => r.services),
  setProjectNotificationServices: (projectId: string, serviceIds: string[]) =>
    request<void>(`/projects/${projectId}/notification-services`, {
      method: "PUT",
      body: JSON.stringify({ serviceIds }),
    }),
};
