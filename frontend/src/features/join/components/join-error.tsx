import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Lock, ChevronLeft } from "lucide-react";

interface JoinErrorProps {
  message: string;
  onBack: () => void;
}

export function JoinError({ message, onBack }: JoinErrorProps): ReactNode {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 min-h-[100dvh] lg:min-h-full space-y-6">
      <div className="p-5 rounded-full bg-secondary text-secondary-foreground">
        <Lock className="w-10 h-10" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Access Denied
        </h2>
        <p className="text-base text-muted-foreground max-w-[300px] mx-auto">
          {message}
        </p>
      </div>
      <Button
        variant="ghost"
        onClick={onBack}
        className="font-medium mt-4 h-11 px-6 rounded-xl text-base hover:bg-secondary/50"
      >
        <ChevronLeft className="w-5 h-5 mr-2" />
        Go Back
      </Button>
    </div>
  );
}
