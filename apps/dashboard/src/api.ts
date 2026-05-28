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

export type SubmissionType =
  | "bug"
  | "feedback"
  | "waitlist"
  | "question"
  | "other";

export type SubmissionStatus = "new" | "open" | "resolved" | "archived";

export interface Project {
  id: string;
  name: string;
  created_at: number;
  submission_count: number;
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
  include_subject: number;
  include_message: number;
  include_email: number;
  include_meta: number;
  include_screenshot: number;
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
  include_subject: boolean;
  include_message: boolean;
  include_email: boolean;
  include_meta: boolean;
  include_screenshot: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
}

/** A row in the submissions list. Screenshot/meta are omitted for size. */
export interface Submission {
  id: string;
  type: SubmissionType;
  subject: string | null;
  message: string | null;
  email: string | null;
  has_screenshot: number;
  status: SubmissionStatus;
  api_key_name: string | null;
  created_at: number;
}

/** A single submission with its full payload, loaded on demand. */
export interface SubmissionDetail extends Omit<Submission, "has_screenshot"> {
  screenshot: string | null;
  meta: string | null;
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

  listSubmissions: (
    projectId: string,
    filters: {
      type?: string;
      status?: string;
      keyId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) => {
    const qs = new URLSearchParams();
    if (filters.type) qs.set("type", filters.type);
    if (filters.status) qs.set("status", filters.status);
    if (filters.keyId) qs.set("keyId", filters.keyId);
    if (filters.limit != null) qs.set("limit", String(filters.limit));
    if (filters.offset != null) qs.set("offset", String(filters.offset));
    const suffix = qs.toString() ? `?${qs}` : "";
    return request<{
      items: Submission[];
      total: number;
      limit: number;
      offset: number;
    }>(`/projects/${projectId}/submissions${suffix}`);
  },
  getSubmission: (id: string) =>
    request<{ submission: SubmissionDetail }>(`/submissions/${id}`).then(
      (r) => r.submission,
    ),
  updateSubmissionStatus: (id: string, status: SubmissionStatus) =>
    request<{ id: string; status: SubmissionStatus }>(`/submissions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

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
