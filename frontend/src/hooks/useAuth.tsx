import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { getMagic } from '@/lib/magic';
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
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
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

  /**
   * Passwordless Magic login:
   * 1. Magic sends OTP to user's email
   * 2. User enters OTP in Magic's UI overlay
   * 3. Magic returns a DID token
   * 4. We send the DID token to our backend, which verifies it and returns a JWT
   */
  const loginWithEmail = useCallback(async (email: string) => {
    const magic = getMagic();

    // Triggers Magic's built-in email OTP UI — resolves after user completes it
    const didToken = await magic.auth.loginWithEmailOTP({ email });

    if (!didToken) throw new Error('Magic login failed — no DID token returned');

    // Exchange DID token for our app JWT
    const { data } = await api.post('/api/v1/auth/login', {}, {
      headers: { Authorization: `Bearer ${didToken}` },
    });

    localStorage.setItem('flowmate_token', data.data.token);
    localStorage.setItem('flowmate_user', JSON.stringify(data.data.user));
    setUser(data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const magic = getMagic();
      await magic.user.logout();
    } catch {
      // Ignore Magic logout errors — we still clear local state
    }
    localStorage.removeItem('flowmate_token');
    localStorage.removeItem('flowmate_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
