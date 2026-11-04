'use client';

/**
 * Authenticated fetch wrapper for write API routes.
 * The admin password is stored in localStorage after first successful auth.
 */

const AUTH_STORAGE_KEY = 'distrifragancias-admin-auth';

export async function readApiError(response: Response, fallback: string): Promise<Error> {
  const text = await response.text();

  if (!text) {
    return new Error(fallback);
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === 'string' && parsed.error.trim()) {
      return new Error(parsed.error);
    }
  } catch {
    // Ignore parse failures; fall back to raw text.
  }

  if (response.status === 401) {
    return new Error('No autorizado. Iniciá sesión como admin.');
  }

  if (response.status === 403) {
    return new Error('Contraseña incorrecta.');
  }

  return new Error(text);
}

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

  // If auth is invalid or stale, clear it so the user must log in again.
  if (response.status === 401 || response.status === 403) {
    clearAdminPassword();
  }

  return response;
}
