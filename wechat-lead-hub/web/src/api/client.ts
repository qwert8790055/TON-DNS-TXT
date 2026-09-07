const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export interface Lead {
  id: number;
  lead_uuid: string;
  mobile: string | null;
  name: string | null;
  channel_code: string | null;
  agent_name: string | null;
  team_name: string | null;
  account_type: string;
  status: string;
  subscribed_at: string;
  captured_at: string | null;
  pushed_at: string | null;
}

export interface WechatAccount {
  id: number;
  name: string;
  app_id: string;
  app_secret: string;
  account_type: 'service' | 'subscribe';
  token: string;
  encoding_aes_key: string | null;
  welcome_text: string;
  enabled: number;
}

export interface Channel {
  id: number;
  name: string;
  code: string;
  account_id: number;
  agent_name: string | null;
  team_name: string | null;
  qrcode_url: string | null;
  enabled: number;
}

export interface ThirdPartyConfig {
  id: number;
  name: string;
  mode: 'api' | 'redirect' | 'manual';
  api_url: string | null;
  api_key: string | null;
  redirect_url_template: string | null;
  callback_secret: string | null;
  retry_count: number;
  enabled: number;
}

export interface DashboardStats {
  total_leads: number;
  subscribed: number;
  captured: number;
  pushed: number;
  push_failed: number;
  duplicate: number;
  conversion_rate: number;
  push_success_rate: number;
  by_channel: Array<{ channel_code: string; agent_name: string | null; total: number; captured: number; pushed: number }>;
  by_account: Array<{ account_id: number; account_type: string; total: number; captured: number; pushed: number }>;
  daily: Array<{ date: string; subscribed: number; captured: number; pushed: number }>;
}
