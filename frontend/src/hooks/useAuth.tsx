import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '@/lib/api';

interface AuthUser {
  id: string;
  email: string;
  flowAddress: string;
  autonomyMode: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('flowmate_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/api/v1/auth/login', { email, password });
    localStorage.setItem('flowmate_token', data.data.token);
    localStorage.setItem('flowmate_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/api/v1/auth/register', { email, password });
    localStorage.setItem('flowmate_token', data.data.token);
    localStorage.setItem('flowmate_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('flowmate_token');
    localStorage.removeItem('flowmate_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
