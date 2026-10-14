'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUserResponse, LoginResponseDto } from '@sai/shared-types';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: AuthUserResponse | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<LoginResponseDto>;
  verifyMfa: (userId: string, totpCode: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<AuthUserResponse | null>;
  activeBranchId: string;
  setActiveBranchId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const checkSession = async (): Promise<AuthUserResponse | null> => {
    try {
      const res: any = await apiClient.get('/auth/me');
      if (res && res.data) {
        const u = res.data.user || res.data;
        if (u && (u.id || u.email)) {
          setUser(u);
          setActiveBranchIdState(u.branchId || '');
          if (typeof window !== 'undefined') {
            localStorage.setItem('sai_user_profile', JSON.stringify(u));
          }
          return u;
        }
      }
    } catch {
      // If server session check fails, check local fallback
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('sai_user_profile');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            setActiveBranchIdState(parsed.branchId || '');
            return parsed;
          } catch {}
        }
      }
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      await checkSession();
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sai_active_branch_id', id);
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<LoginResponseDto> => {
    const res: any = await apiClient.post('/auth/login', { email, password, rememberMe });
    const data: LoginResponseDto = res.data;

    if (!data.requiresMfa && data.user) {
      setUser(data.user);
      setActiveBranchId(data.user.branchId);

      if (data.accessToken) {
        setToken(data.accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sai_access_token', data.accessToken);
          localStorage.setItem('sai_user_profile', JSON.stringify(data.user));
        }
      }
    }

    return data;
  };

  const verifyMfa = async (userId: string, totpCode: string): Promise<void> => {
    const res: any = await apiClient.post('/auth/mfa/verify', { userId, totpCode });
    const data: LoginResponseDto = res.data;

    if (data.user) {
      setUser(data.user);
      setActiveBranchId(data.user.branchId);
      if (data.accessToken) {
        setToken(data.accessToken);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sai_access_token', data.accessToken);
          localStorage.setItem('sai_user_profile', JSON.stringify(data.user));
        }
      }
      router.push('/dashboard');
    }
  };

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sai_access_token');
      localStorage.removeItem('sai_refresh_token');
      localStorage.removeItem('sai_user_profile');
      localStorage.removeItem('sai_active_branch_id');
    }
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const isOwner = user?.role === 'OWNER';
  const isAdmin = user?.role === 'ADMIN' || isOwner;
  const isStaff = user?.role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isOwner,
        isAdmin,
        isStaff,
        login,
        verifyMfa,
        logout,
        checkSession,
        activeBranchId,
        setActiveBranchId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
