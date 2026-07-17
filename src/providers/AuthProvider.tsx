"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authRepository } from "@/repositories";
import { User } from "@/repositories/interfaces";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkUser = async () => {
    try {
      const currentUser = await authRepository.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkUser();
  }, []);

  const logout = async () => {
    setLoading(true);
    await authRepository.logout();
    setUser(null);
    setLoading(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser: checkUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
