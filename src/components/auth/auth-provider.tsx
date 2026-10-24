"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser, getProfile } from "@/lib/api";
import type { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setUser = useCallback((nextUser: User | null) => {
    setUserState(nextUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    const syncSession = () => {
      const currentUser = getCurrentUser();
      setUserState(currentUser);
      if (!currentUser) setLoading(false);
    };
    window.addEventListener("shiftr:session-change", syncSession);
    if (getCurrentUser()) {
      void getProfile()
        .then((profile) => setUserState(profile))
        .catch(() => setUserState(null))
        .finally(() => setLoading(false));
    } else {
      const timeout = window.setTimeout(() => setLoading(false), 0);
      return () => {
        window.removeEventListener("shiftr:session-change", syncSession);
        window.clearTimeout(timeout);
      };
    }
    return () => window.removeEventListener("shiftr:session-change", syncSession);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
