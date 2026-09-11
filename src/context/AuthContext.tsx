'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChanged, getLocalUser, type AppUser } from '@/lib/auth';

interface AuthContextType {
  user: User | AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial local user right away to avoid initial loading flash
    const initialLocal = getLocalUser();
    if (initialLocal) {
      setUser(initialLocal);
      setLoading(false);
    }

    const unsubscribe = onAuthChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
