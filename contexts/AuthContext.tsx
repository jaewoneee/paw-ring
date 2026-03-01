import React, { createContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  registerWithEmail,
  loginWithEmail,
  signOut,
  resetPassword,
} from "@/services/auth";
import { createUserProfile, getUserProfile } from "@/services/firestore";
import type { UserProfile } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = useCallback(
    async (email: string, password: string, nickname: string) => {
      const credential = await registerWithEmail(email, password);
      await createUserProfile(credential.user.uid, {
        email,
        nickname,
        provider: "email",
      });
      const profile = await getUserProfile(credential.user.uid);
      setUserProfile(profile);
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    await loginWithEmail(email, password);
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await resetPassword(email);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        register,
        login,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
