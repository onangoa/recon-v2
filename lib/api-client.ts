'use client';

export interface AuthRefreshData {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    avatar?: string | null;
    permissions?: string[];
  };
  contractor: {
    id: string;
    companyName: string;
    location: string;
    phoneNumber: string;
    licenseNo: string;
    userId: string;
  } | null;
  sites: Array<{
    id: string;
    name: string;
    location: string;
    status: string;
    isPrimary: boolean;
    projectId: string | null;
  }>;
  selectedSiteId: string | null;
  needsOnboarding: boolean;
}

type RefreshedCallback = (data: AuthRefreshData) => void;
type UnauthorizedCallback = () => void;

let onRefreshed: RefreshedCallback | null = null;
let onUnauthorized: UnauthorizedCallback | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;

export type RefreshResult = 'success' | 'invalid' | 'network';

export function setAuthCallbacks(
  refreshed: RefreshedCallback | null,
  unauthorized: UnauthorizedCallback | null,
): void {
  onRefreshed = refreshed;
  onUnauthorized = unauthorized;
}

export function refreshOnce(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const res = await fetch('/web/api/auth/refresh', { method: 'POST' });

      if (res.status === 401) {
        onUnauthorized?.();
        return 'invalid';
      }
      if (!res.ok) {
        return 'network';
      }

      const data: AuthRefreshData = await res.json();
      onRefreshed?.(data);
      return 'success';
    } catch {
      return 'network';
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const fetchInit: RequestInit = { ...init, credentials: 'include' };
  let res = await fetch(url, fetchInit);

  if (res.status === 401) {
    const result = await refreshOnce();

    if (result === 'success') {
      res = await fetch(url, fetchInit);
    }
  }

  return res;
}

export async function apiFetchJSON<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ data: T; ok: true; status: number } | { data: unknown; ok: false; status: number }> {
  const res = await apiFetch(url, init);
  const data = await res.json().catch(() => null);
  return { data, ok: res.ok, status: res.status } as
    | { data: T; ok: true; status: number }
    | { data: unknown; ok: false; status: number };
}
