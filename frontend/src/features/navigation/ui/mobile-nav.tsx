import { Link, useLocation } from "@tanstack/react-router";
import { GrSettingsOption } from "react-icons/gr";
import { IoChatbubblesOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
}

export function MobileNav(): React.ReactNode {
  const { pathname } = useLocation();

  const navItems: NavItem[] = [
    { icon: IoChatbubblesOutline, label: "Chats", to: "/" },
    { icon: GrSettingsOption, label: "Settings", to: "/settings" },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 flex justify-center px-6 z-[100] pointer-events-none">
      <nav className="flex items-center gap-1 p-1 bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-2xl pointer-events-auto">
        {navItems.map((item: NavItem) => {
          const isActive: boolean =
            pathname === item.to || (item.to === "/" && pathname === "/");

          return (
            <Link
              key={item.to}
              to={item.to}
              className="relative flex items-center gap-2 px-5 py-3 rounded-full transition-colors duration-300"
            >
              {/* Активный фон-пузырь */}
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 bg-primary shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]"
                  style={{ borderRadius: 9999 }}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}

              <div
                className={cn(
                  "relative z-10 flex items-center gap-2 transition-colors duration-300",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="h-5.5 w-5.5" />

                <AnimatePresence mode="popLayout" initial={false}>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="text-[14px] font-semibold tracking-tight"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
