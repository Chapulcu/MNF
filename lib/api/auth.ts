export interface LoginResponse {
  success: boolean;
  player?: {
    id: string;
    name: string;
    isAdmin: boolean;
  };
  error?: string;
}

export interface SessionResponse {
  authenticated: boolean;
  player?: {
    id: string;
    name: string;
    isAdmin: boolean;
  };
}

export interface AuthPlayer {
  id: string;
  name: string;
  isAdmin: boolean;
}

const API_BASE = '/api/auth';

export async function login(playerId: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    return { success: false, error: error.error || 'Login failed' };
  }

  return response.json();
}

export async function logout(): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
  });

  return response.json();
}

export async function getSession(): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE}/login`);

  if (!response.ok) {
    return { authenticated: false };
  }

  return response.json();
}
