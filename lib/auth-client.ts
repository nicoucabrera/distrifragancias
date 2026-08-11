'use client';

/**
 * Authenticated fetch wrapper for write API routes.
 * The admin password is stored in localStorage after first successful auth.
 */

const AUTH_STORAGE_KEY = 'distrifragancias-admin-auth';

function getStoredAuth(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminPassword(password: string): void {
  const encoded = btoa(`admin:${password}`);
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, encoded);
  } catch {
    // localStorage unavailable
  }
}

export function clearAdminPassword(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasAdminAuth(): boolean {
  return getStoredAuth() !== null;
}

export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const auth = getStoredAuth();
  const headers = new Headers(options.headers);

  if (auth) {
    headers.set('Authorization', `Basic ${auth}`);
  }

  const response = await fetch(url, { ...options, headers });

  // If 401, clear stale auth
  if (response.status === 401) {
    clearAdminPassword();
  }

  return response;
}
