import { type ReactNode } from "react";
import { type LucideIcon, Image as ImageIcon } from "lucide-react";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function MediaEmptyState({
  icon: Icon = ImageIcon,
  title,
  description,
}: Props): ReactNode {
  return (
    <div className="py-20 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/5 border-muted/30">
      <Icon className="w-10 h-10 mb-3 text-muted-foreground/20" />
      <p className="text-xs font-semibold text-muted-foreground/50">{title}</p>
      {description && (
        <p className="text-[10px] text-muted-foreground/30 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
