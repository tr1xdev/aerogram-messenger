import { create } from "zustand";

interface ConnectionState {
  isWsConnected: boolean;
  setIsWsConnected: (status: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isWsConnected: false,
  setIsWsConnected: (status: boolean) => set({ isWsConnected: status }),
}));
