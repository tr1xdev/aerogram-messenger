import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type UserRole = "user" | "admin" | "moderator";

export interface AuthUser {
  accountNo: string;
  email: string;
  role: UserRole[];
  exp: number;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuth: boolean;
  login: (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  setAccessToken: (token: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  isTokenExpired: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuth: false,

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken: refreshToken ?? null,
          isAuth: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuth: false,
        }),

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) => set({ accessToken, isAuth: true }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuth: true }),

      isTokenExpired: () => {
        const { user } = get();
        if (!user?.exp) return true;
        return Date.now() >= user.exp;
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuth: state.isAuth,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user?.exp && Date.now() >= state.user.exp) {
          state.logout();
        }
      },
    },
  ),
);
