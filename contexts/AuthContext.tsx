import React, { createContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, reload, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  registerWithEmail,
  loginWithEmail,
  signInWithGoogle,
  signOut,
  resetPassword,
} from "@/services/auth";
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  deleteUserData,
} from "@/services/user";
import {
  reauthenticateWithEmail,
  reauthenticateWithGoogle,
  deleteAccount as deleteAccountService,
} from "@/services/account";
import type { UserProfile } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (
    data: Partial<
      Pick<UserProfile, "nickname" | "profile_image" | "notification_enabled">
    >
  ) => Promise<void>;
  deleteAccount: (credential?: { type: "email"; password: string } | { type: "google"; idToken: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      try {
        if (firebaseUser) {
          let profile = await getUserProfile(firebaseUser.uid);
          // Supabase에 프로필이 없으면 자동 생성 (Firestore → Supabase 마이그레이션 대응)
          if (!profile) {
            await createUserProfile(firebaseUser.uid, {
              email: firebaseUser.email ?? "",
              nickname: firebaseUser.displayName ?? "사용자",
              provider: firebaseUser.providerData[0]?.providerId === "google.com"
                ? "google"
                : "email",
              profile_image: firebaseUser.photoURL ?? undefined,
            });
            profile = await getUserProfile(firebaseUser.uid);
          }
          // Firebase emailVerified → Supabase email_verified 동기화
          if (profile && firebaseUser.emailVerified && !profile.email_verified) {
            await updateUserProfile(firebaseUser.uid, { email_verified: true });
            profile = { ...profile, email_verified: true };
          }
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('[AuthContext] 프로필 로드 실패:', err);
      } finally {
        setIsLoading(false);
      }
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

  const handleLoginWithGoogle = useCallback(async (idToken: string) => {
    const { credential, isNewUser } = await signInWithGoogle(idToken);
    const firebaseUser = credential.user;

    if (isNewUser) {
      await createUserProfile(firebaseUser.uid, {
        email: firebaseUser.email ?? "",
        nickname: firebaseUser.displayName ?? "사용자",
        provider: "google",
        profile_image: firebaseUser.photoURL ?? "",
      });
    }

    const profile = await getUserProfile(firebaseUser.uid);
    setUserProfile(profile);
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await resetPassword(email);
  }, []);

  const updateProfile = useCallback(
    async (
      data: Partial<
        Pick<UserProfile, "nickname" | "profile_image" | "notification_enabled">
      >
    ) => {
      if (!user) throw new Error("Not authenticated");
      await updateUserProfile(user.uid, data);
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
    },
    [user]
  );

  const handleDeleteAccount = useCallback(
    async (credential?: { type: "email"; password: string } | { type: "google"; idToken: string }) => {
      if (!user) throw new Error("Not authenticated");
      if (credential?.type === "email") {
        await reauthenticateWithEmail(credential.password);
      } else if (credential?.type === "google") {
        await reauthenticateWithGoogle(credential.idToken);
      }
      await deleteUserData(user.uid);
      await deleteAccountService();
    },
    [user]
  );

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await reload(auth.currentUser);
      // 새 객체로 설정해야 React가 변경을 감지함
      setUser({ ...auth.currentUser });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        register,
        login,
        loginWithGoogle: handleLoginWithGoogle,
        logout,
        forgotPassword,
        refreshUser,
        updateProfile,
        deleteAccount: handleDeleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
