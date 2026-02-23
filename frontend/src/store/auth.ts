import { create } from "zustand";

interface AuthState {
  isAuth: boolean;
  setAuth: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuth: !!localStorage.getItem("access_token"),
  setAuth: (value) => set({ isAuth: value }),
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ isAuth: false });
  },
}));
