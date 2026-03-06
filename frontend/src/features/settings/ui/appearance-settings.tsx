import { Monitor, Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/theme";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function AppearanceSettings() {
  const { theme, setTheme } = useThemeStore();

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="space-y-4 py-4">
      <div>
        <h4 className="text-sm font-medium mb-1">Theme</h4>
        <p className="text-xs text-muted-foreground">
          Choose how the interface looks on your device.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => (
          <Button
            key={t.id}
            variant={theme === t.id ? "default" : "outline"}
            className="flex flex-col items-center justify-center h-20 gap-2 relative overflow-hidden"
            onClick={() => setTheme(t.id)}
          >
            <t.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{t.label}</span>
            {theme === t.id && (
              <motion.div
                layoutId="active-theme-bg"
                className="absolute inset-0 bg-primary/5 pointer-events-none"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
