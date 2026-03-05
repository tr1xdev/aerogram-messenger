import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Camera,
  AtSign,
  Plus,
  UserCircle,
  Laptop,
  Lock,
  Palette,
  Languages,
  Bell,
  Database,
  HelpCircle,
  ShieldCheck,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { SettingsButton } from "./settings-button";
import type { User } from "@/entities/chat/model/types";

interface MobileSettingsViewProps {
  user: User | undefined;
}

export function MobileSettingsView({ user }: MobileSettingsViewProps) {
  const [showHeader, setShowHeader] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "User";

  useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (!viewport) return;
    const handleScroll = () => setShowHeader(viewport.scrollTop > 80);
    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex h-full w-full flex-col bg-background md:hidden relative overflow-hidden font-sans">
      <header
        className={cn(
          "absolute top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6 backdrop-blur-xl transition-all duration-300 border-b",
          showHeader
            ? "bg-background/80 border-border shadow-sm translate-y-0 opacity-100"
            : "bg-transparent border-transparent -translate-y-2 opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.photoUrl} />
            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm tracking-tight">
            {displayName}
          </span>
        </div>
      </header>

      <ScrollArea ref={scrollRef} className="h-full w-full">
        <div className="relative flex flex-col items-center pt-16 pb-10">
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/5 to-transparent -z-10" />

          <div className="relative">
            <Avatar className="h-32 w-32 ring-4 ring-background shadow-2xl">
              <AvatarImage src={user?.photoUrl} className="object-cover" />
              <AvatarFallback className="text-4xl font-bold text-white bg-gradient-to-tr from-primary to-primary/60">
                {displayName[0]}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-1 right-1 p-2 bg-primary text-primary-foreground rounded-full shadow-lg border-2 border-background">
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 text-center px-4">
            <h2 className="text-2xl font-bold tracking-tight leading-tight">
              {displayName}
            </h2>
            <p className="text-muted-foreground text-sm font-medium mt-0.5">
              {user?.username ? `@${user.username}` : "No username set"}
            </p>
          </div>
        </div>

        <div className="px-4 space-y-8 pb-32 max-w-2xl mx-auto">
          <section>
            <h3 className="px-4 mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Profile
            </h3>
            <div className="overflow-hidden rounded-2xl bg-card/50 border border-border/50 shadow-sm backdrop-blur-sm">
              <SettingsButton
                icon={AtSign}
                label={user?.username ? "Username" : "Set Username"}
                type={user?.username ? "copy" : "action"}
                value={user?.username ? `@${user.username}` : undefined}
              />
              <SettingsButton
                icon={UserCircle}
                label="Account ID"
                type="copy"
                value={user?.id}
              />
              <SettingsButton
                icon={ShieldCheck}
                label="Public Key"
                type="copy"
                value={user?.publicKey}
              />
              <SettingsButton icon={Plus} label="Add Account" type="action" />
            </div>
          </section>

          <section>
            <h3 className="px-4 mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Settings
            </h3>
            <div className="overflow-hidden rounded-2xl bg-card/50 border border-border/50 shadow-sm">
              <SettingsButton
                icon={Bell}
                label="Notifications"
                value="Enabled"
              />
              <SettingsButton icon={Database} label="Data & Storage" />
              <SettingsButton icon={Palette} label="Appearance" type="action" />
              <SettingsButton
                icon={Languages}
                label="Language"
                value="English"
              />
            </div>
          </section>

          <section>
            <h3 className="px-4 mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Privacy & Security
            </h3>
            <div className="overflow-hidden rounded-2xl bg-card/50 border border-border/50 shadow-sm">
              <SettingsButton icon={Lock} label="Privacy Policy" />
              <SettingsButton icon={ShieldCheck} label="Security Checkup" />
              <SettingsButton icon={Laptop} label="Devices" value="3 active" />
            </div>
          </section>

          <section>
            <div className="overflow-hidden rounded-2xl bg-card/50 border border-border/50 shadow-sm">
              <SettingsButton
                icon={Gift}
                label="Premium Features"
                type="link"
              />
              <SettingsButton icon={HelpCircle} label="Support" type="action" />
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
