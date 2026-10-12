'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUserResponse, LoginResponseDto } from '@sai/shared-types';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: AuthUserResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponseDto>;
  verifyMfa: (userId: string, totpCode: string) => Promise<void>;
  logout: () => void;
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

  useEffect(() => {
    const savedToken = localStorage.getItem('sai_access_token');
    const savedBranch = localStorage.getItem('sai_active_branch_id');
    const savedUser = localStorage.getItem('sai_user_profile');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setActiveBranchIdState(savedBranch || parsed.branchId || '');
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
    localStorage.setItem('sai_active_branch_id', id);
  };

  const login = async (email: string, password: string): Promise<LoginResponseDto> => {
    const res: any = await apiClient.post('/auth/login', { email, password });
    const data: LoginResponseDto = res.data;

    if (!data.requiresMfa && data.accessToken && data.user) {
      setToken(data.accessToken);
      setUser(data.user);
      setActiveBranchId(data.user.branchId);

      localStorage.setItem('sai_access_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('sai_refresh_token', data.refreshToken);
      }
      localStorage.setItem('sai_user_profile', JSON.stringify(data.user));
    }

    return data;
  };

  const verifyMfa = async (userId: string, totpCode: string): Promise<void> => {
    const res: any = await apiClient.post('/auth/mfa/verify', { userId, totpCode });
    const data: LoginResponseDto = res.data;

    if (data.accessToken && data.user) {
      setToken(data.accessToken);
      setUser(data.user);
      setActiveBranchId(data.user.branchId);

      localStorage.setItem('sai_access_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('sai_refresh_token', data.refreshToken);
      }
      localStorage.setItem('sai_user_profile', JSON.stringify(data.user));
      router.push('/');
    }
  };

  const logout = () => {
    apiClient.post('/auth/logout').catch(() => {});
    localStorage.removeItem('sai_access_token');
    localStorage.removeItem('sai_refresh_token');
    localStorage.removeItem('sai_user_profile');
    localStorage.removeItem('sai_active_branch_id');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        verifyMfa,
        logout,
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
