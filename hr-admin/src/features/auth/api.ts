import { api } from '@/lib/api';
import type { AuthUser } from './types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return api('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchMe(): Promise<AuthUser> {
  return api('/auth/me');
}
