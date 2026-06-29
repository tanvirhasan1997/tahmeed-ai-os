const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_PREFIX = `${API_URL}/api/v1`;

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("auth-storage");
  if (!stored) return null;
  try { return JSON.parse(stored)?.state?.tokens?.access_token || null; } catch { return null; }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as any || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_PREFIX}${endpoint}`, { ...options, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({ detail: "Error" })); throw new Error(err.detail); }
  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  login: (email: string, password: string) => request<any>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => request<any>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  sendCommand: (content: string, workspaceId: string) => request<any>("/command", { method: "POST", body: JSON.stringify({ content, workspace_id: workspaceId }) }),
  getWorkspaces: () => request<any>("/workspaces"),
  getDashboard: (wsId?: string) => request<any>(`/dashboard/overview${wsId ? `?workspace_id=${wsId}` : ""}`),
  getMemories: () => request<any>("/memory"),
  getDocuments: (wsId: string) => request<any>(`/vault?workspace_id=${wsId}`),
  getTasks: () => request<any>("/tasks"),
  getNotifications: () => request<any>("/notifications"),
};
