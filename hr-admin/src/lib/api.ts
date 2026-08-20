import { getToken } from './token';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL = '/api';

/** 공용 fetch 래퍼 — 실제 백엔드로 교체해도 BASE_URL만 바꾸면 된다 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE_URL + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${res.status}: ${init?.method ?? 'GET'} ${path}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
