"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiPost } from "@/lib/api";

interface CurrentUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isSuperadmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
  isSuperadmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiPost<CurrentUser>("/auth/me", { method: "GET" });
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost<{ user: CurrentUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  const isSuperadmin = user?.role === "superadmin";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, isSuperadmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
