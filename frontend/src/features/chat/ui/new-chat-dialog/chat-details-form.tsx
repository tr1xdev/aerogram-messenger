import { Camera, Globe, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import React, { useState, type ReactElement } from "react";

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
  const [channelType, setChannelType] = useState<"public" | "private">(
    "public",
  );
  const [slugValue, setSlugValue] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const formData: FormData = new FormData(e.currentTarget);
    const title: string = formData.get("title") as string;

    onSubmit({
      title,
      ...(type === "CHANNEL" && channelType === "public" && slugValue
        ? { slug: slugValue }
        : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 py-2">
      <div className="flex justify-center">
        <div className="relative group cursor-pointer">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border transition-colors group-hover:bg-accent">
            <Camera className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="absolute inset-0 rounded-full bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-[9px] text-white font-semibold uppercase tracking-wider">
              Upload
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-1.5">
          <Label htmlFor="title" className="text-xs text-muted-foreground">
            {type === "GROUP" ? "Group Name" : "Channel Name"}
          </Label>
          <Input
            id="title"
            name="title"
            placeholder="Enter name..."
            required
            autoFocus
            className="h-9 rounded-lg"
          />
        </div>

        {type === "CHANNEL" && (
          <div className="space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Channel Type
              </Label>
              <RadioGroup
                onValueChange={(val: "public" | "private"): void => {
                  setChannelType(val);
                  if (val === "private") {
                    setSlugValue("");
                  }
                }}
                value={channelType}
                className="grid grid-cols-2 gap-2"
              >
                <div>
                  <RadioGroupItem
                    value="public"
                    id="public"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="public"
                    className="flex flex-col items-center justify-between rounded-lg border bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <Globe className="mb-1 h-4 w-4 text-muted-foreground peer-data-[state=checked]:text-primary" />
                    <span className="text-xs font-medium">Public</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="private"
                    id="private"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="private"
                    className="flex flex-col items-center justify-between rounded-lg border bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <Lock className="mb-1 h-4 w-4 text-muted-foreground peer-data-[state=checked]:text-primary" />
                    <span className="text-xs font-medium">Private</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {channelType === "public" && (
              <div className="grid gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="slug" className="text-xs text-muted-foreground">
                  Public Link
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-muted-foreground select-none">
                    @
                  </span>
                  <Input
                    id="slug"
                    name="slug"
                    className="pl-7 h-9 rounded-lg"
                    placeholder="unique_address"
                    value={slugValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                      setSlugValue(e.target.value)
                    }
                    required={channelType === "public"}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/85 px-0.5">
                  Users will be able to find your channel by this link.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="ghost"
          className="flex-1 h-9 text-xs rounded-lg"
          onClick={onBack}
          type="button"
        >
          Back
        </Button>
        <Button className="flex-[2] h-9 text-xs rounded-lg" type="submit">
          Create
        </Button>
      </div>
    </form>
  );
}
