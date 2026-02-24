import { create } from "zustand";

interface ChatState {
  input: string;
  setInput: (val: string) => void;
  resetInput: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  input: "",
  setInput: (val) => set({ input: val }),
  resetInput: () => set({ input: "" }),
}));
