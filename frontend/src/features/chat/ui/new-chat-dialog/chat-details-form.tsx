import { Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import React, { type ReactElement } from "react";

interface ChatFormData {
  title: string;
  slug?: string;
}

interface ChatDetailsFormProps {
  type: "GROUP" | "CHANNEL";
  onSubmit: (data: ChatFormData) => void;
  onBack: () => void;
}

export function ChatDetailsForm({
  type,
  onSubmit,
  onBack,
}: ChatDetailsFormProps): ReactElement {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const formData: FormData = new FormData(e.currentTarget);
    const title: string = formData.get("title") as string;
    const slug: string | null = formData.get("slug") as string | null;

    onSubmit({
      title,
      ...(slug ? { slug } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="flex justify-center">
        <div className="relative group cursor-pointer">
          <div className="h-24 w-24 rounded-3xl bg-muted flex items-center justify-center border-2 border-dashed transition-colors group-hover:bg-accent">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-[10px] text-white font-medium uppercase tracking-wider">
              Upload
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">
            {type === "GROUP" ? "Group Name" : "Channel Name"}
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter name..."
            required
            autoFocus
          />
        </div>

        {type === "CHANNEL" && (
          <div className="grid gap-2">
            <Label htmlFor="slug">Public Link</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">
                @
              </span>
              <Input
                id="slug"
                name="slug"
                className="pl-7"
                placeholder="unique_address"
              />
            </div>
            <p className="text-[0.7rem] text-muted-foreground px-1">
              Users will be able to find your channel by this link.
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          className="flex-1"
          onClick={onBack}
          type="button"
        >
          Back
        </Button>
        <Button className="flex-[2]" type="submit">
          Continue
        </Button>
      </div>
    </form>
  );
}
