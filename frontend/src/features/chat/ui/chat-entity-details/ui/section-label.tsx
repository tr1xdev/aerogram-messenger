import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: Props): ReactNode {
  return (
    <h4
      className={cn(
        "text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1",
        className,
      )}
    >
      {children}
    </h4>
  );
}
