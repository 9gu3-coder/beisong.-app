// 认证上下文
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';
import { localUserService } from '../utils/localStorage';

const ENABLE_BACKEND = false  // 关闭用户系统

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  backendAvailable: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: { name?: string; password?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(ENABLE_BACKEND);

  useEffect(() => {
    // 检查是否已登录（从 localStorage 读取）
    const savedUser = localStorage.getItem('recitation_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('recitation_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    if (ENABLE_BACKEND) {
      // 使用本地用户系统
      const loggedInUser = localUserService.login(email, password);
      localStorage.setItem('recitation_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
    } else {
      // 使用远程后端
      const response = await authApi.login(email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    if (ENABLE_BACKEND) {
      // 使用本地用户系统
      const newUser = localUserService.register(name, email, password);
      localStorage.setItem('recitation_user', JSON.stringify(newUser));
      setUser(newUser);
    } else {
      // 使用远程后端
      const response = await authApi.register(email, password, name);
      localStorage.setItem('token', response.token);
      setUser(response.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('recitation_user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = async (data: { name?: string; password?: string }) => {
    if (ENABLE_BACKEND && user) {
      // 使用本地用户系统
      const updatedUser = localUserService.updateUser(user.id, data);
      localStorage.setItem('recitation_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } else {
      const response = await authApi.updateUser(data);
      setUser(response.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        backendAvailable,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
