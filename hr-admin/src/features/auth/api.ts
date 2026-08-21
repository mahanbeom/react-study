import { api } from '@/lib/api';
import type { AuthProfile } from './types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthProfile;
}

export function login(payload: LoginPayload): Promise<LoginResponse> {
  return api('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchMe(): Promise<AuthProfile> {
  return api('/auth/me');
}
