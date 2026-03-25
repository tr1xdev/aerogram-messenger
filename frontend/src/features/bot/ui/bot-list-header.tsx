import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BotListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const BotListHeader: React.FC<BotListHeaderProps> = ({
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="relative flex-1 max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30 group-focus-within:text-primary/50" />
        <Input
          placeholder="Filter bots..."
          className="pl-9 h-9 bg-muted/20 border-none rounded-md text-[13px] focus-visible:ring-1"
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
            onSearchChange(e.target.value)
          }
        />
      </div>
      <Button
        asChild
        className="h-9 px-4 rounded-md font-bold text-[13px] shadow-none"
      >
        <Link to="/bots/create">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Create
        </Link>
      </Button>
    </div>
  );
};
