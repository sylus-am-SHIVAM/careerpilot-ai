"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SESSION_EXPIRED_EVENT, api, getToken, setToken, type User } from "./api";

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = getToken()
      ? api<User>("/me").then(setUser).catch(() => setToken(null))
      : Promise.resolve();
    restore.finally(() => setLoading(false));

    const onExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    const data = await api<{ access_token: string }>("/login", { method: "POST", body });
    setToken(data.access_token);
    setUser(await api<User>("/me"));
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      await api<User>("/users", {
        method: "POST",
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
