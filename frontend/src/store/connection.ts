import { create } from "zustand";

interface ConnectionState {
  isWsConnected: boolean;
  isUpdating: boolean;
  setIsWsConnected: (status: boolean) => void;
  setIsUpdating: (status: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isWsConnected: false,
  isUpdating: false,
  setIsWsConnected: (status: boolean): void => set({ isWsConnected: status }),
  setIsUpdating: (status: boolean): void => set({ isUpdating: status }),
}));
