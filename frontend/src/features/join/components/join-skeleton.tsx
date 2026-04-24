import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function JoinSkeleton(): ReactNode {
  return (
    <div className="w-full h-full flex items-center justify-center p-4 min-h-[100dvh] lg:min-h-full">
      <div className="w-full max-w-[400px] flex flex-col items-center p-10 bg-card border border-border/60 rounded-[32px] shadow-sm">
        <Skeleton className="w-[96px] h-[96px] rounded-full mb-6" />

        <div className="flex flex-col items-center w-full mb-8 space-y-3">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-5 w-1/2 rounded-md" />
        </div>

        <div className="w-full flex flex-col gap-3">
          <Skeleton className="w-full h-12 rounded-xl" />
          <Skeleton className="w-full h-12 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
