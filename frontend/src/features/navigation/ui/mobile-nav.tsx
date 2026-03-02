import { Link, useRouterState } from "@tanstack/react-router";
import { MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = useRouterState().location.pathname;
  const isChatOpen = pathname.startsWith("/chat/");

  if (isChatOpen) return null;

  const navItems = [
    { label: "Chats", icon: MessageSquare, to: "/" },
    { label: "Settings", icon: Settings, to: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-center gap-12 border-t border-border/40 bg-background/60 backdrop-blur-2xl pb-safe md:hidden">
      {navItems.map((item) => {
        const isActive =
          pathname === item.to || (item.to === "/" && pathname === "/");
        return (
          <Link
            key={item.label}
            to={item.to}
            className="group flex flex-col items-center justify-center transition-all duration-300"
          >
            <div
              className={cn(
                "flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300",
                isActive
                  ? "bg-primary/20 text-primary shadow-sm"
                  : "bg-transparent text-muted-foreground/50 group-hover:text-muted-foreground/80",
              )}
            >
              <item.icon
                className={cn(
                  "h-[22px] w-[22px] transition-all duration-300",
                  isActive
                    ? "scale-100 stroke-[2.4px]"
                    : "scale-95 stroke-[1.8px]",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-1 text-[10px] font-bold tracking-tight uppercase transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground/60",
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
