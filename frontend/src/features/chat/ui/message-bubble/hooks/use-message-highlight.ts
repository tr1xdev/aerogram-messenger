import { useState, useEffect } from "react";

export const useMessageHighlight = (messageId: string): boolean => {
  const [isHighlighted, setIsHighlighted] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const handleHighlight = (e: Event): void => {
      const customEvent = e as CustomEvent<{ id: string }>;
      if (customEvent.detail.id === messageId) {
        setIsHighlighted(true);
        setTimeout((): void => setIsHighlighted(false), 1500);
      }
    };
    window.addEventListener("highlight-message", handleHighlight);
    return (): void =>
      window.removeEventListener("highlight-message", handleHighlight);
  }, [messageId]);

  return isHighlighted;
};
