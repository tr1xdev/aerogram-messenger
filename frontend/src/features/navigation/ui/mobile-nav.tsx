import { Link, useLocation } from "@tanstack/react-router";
import { MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const { pathname } = useLocation();

  const navItems = [
    { icon: MessageSquare, label: "Chats", to: "/", fill: false },
    { icon: Settings, label: "Settings", to: "/settings", fill: false },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-border/40 flex items-center justify-around px-6 z-50">
      {navItems.map((item) => {
        const isActive =
          pathname === item.to || (item.to === "/" && pathname === "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[80px] transition-colors",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon
              className={cn("h-6 w-6", isActive && item.fill && "fill-current")}
            />
            <span className="text-[11px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
