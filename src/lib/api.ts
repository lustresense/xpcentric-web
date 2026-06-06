/**
 * Centralized API client for SIMREKAP local backend.
 * All requests should go through this module.
 */

import { toast } from 'sonner';

export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/make-server-32aa5c5c' : 'http://127.0.0.1:8000/make-server-32aa5c5c')
).replace(/\/+$/, '');

let onUnauthorized: (() => void) | null = null;

export interface ApiError {
  status: number;
  message: string;
}

export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn;
}

export async function apiRequest<T = any>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    anonymous?: boolean;
  } = {},
): Promise<T> {
  const { method = 'GET', body, token, anonymous = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (!anonymous && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw { status: 0, message: 'Tidak bisa terhubung ke server lokal API.' } as ApiError;
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    onUnauthorized?.();
    throw { status: 401, message: data.error || 'Sesi berakhir. Silakan login ulang.' } as ApiError;
  }

  if (response.status === 429) {
    toast.error(data.error || 'Terlalu banyak permintaan, coba lagi nanti.');
  }

  if (response.status >= 500) {
    toast.error('Server sedang bermasalah. Coba lagi sebentar.');
  }

  if (!response.ok) {
    throw { status: response.status, message: data.error || `Request gagal (${response.status})` } as ApiError;
  }

  return data as T;
}

function parseFilename(disposition: string | null) {
  if (!disposition) {
    return '';
  }
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded?.[1]) {
    try {
      return decodeURIComponent(encoded[1].replace(/"/g, ''));
    } catch {
      return encoded[1].replace(/"/g, '');
    }
  }
  const plain = disposition.match(/filename="?([^";]+)"?/i);
  return plain?.[1] || '';
}

export async function apiDownload(path: string, token?: string | null) {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers,
    });
  } catch {
    throw { status: 0, message: 'Tidak bisa terhubung ke server lokal API.' } as ApiError;
  }

  if (response.status === 401) {
    onUnauthorized?.();
  }

  if (response.status === 429) {
    toast.error('Terlalu banyak permintaan, coba lagi nanti.');
  }

  if (response.status >= 500) {
    toast.error('Server sedang bermasalah. Coba lagi sebentar.');
  }

  if (!response.ok) {
    const contentType = response.headers.get('Content-Type') || '';
    const data = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : {};
    throw { status: response.status, message: data.error || `Download gagal (${response.status})` } as ApiError;
  }

  return {
    blob: await response.blob(),
    filename: parseFilename(response.headers.get('Content-Disposition')),
  };
}

export function apiGet<T = any>(path: string, token?: string | null) {
  return apiRequest<T>(path, { method: 'GET', token });
}

export function apiPost<T = any>(path: string, body: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: 'POST', body, token });
}

export function apiPut<T = any>(path: string, body: unknown, token?: string | null) {
  return apiRequest<T>(path, { method: 'PUT', body, token });
}

export function apiPublicPost<T = any>(path: string, body: unknown) {
  return apiRequest<T>(path, { method: 'POST', body, anonymous: true });
}

export function apiPublicGet<T = any>(path: string) {
  return apiRequest<T>(path, { method: 'GET', anonymous: true });
}
