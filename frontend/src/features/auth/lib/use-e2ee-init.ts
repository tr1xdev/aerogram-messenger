import { useEffect } from "react";
import type { User } from "@/entities/chat/model/types";

export function useE2EEInit(me?: User): void {
  useEffect((): void => {
    if (!me) return;

    const init = async (): Promise<void> => {
      try {
        // TODO: E2EE Init Logic
      } catch (err: unknown) {
        console.error("[E2EE] Init error:", err);
      }
    };

    init();
  }, [me]);
}
