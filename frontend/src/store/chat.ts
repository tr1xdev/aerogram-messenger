import { create } from "zustand";

interface ChatState {
  input: string;
  activeChatId: string | null;
  setInput: (val: string) => void;
  setActiveChatId: (id: string | null) => void;
  resetInput: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  input: "",
  activeChatId: null,
  setInput: (val) => set({ input: val }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  resetInput: () => set({ input: "" }),
}));
