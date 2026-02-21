import { Sun, Moon } from "lucide-react";
import { Button } from "./button";
import { useThemeStore } from "@/store/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <Button variant="outline" className="ml-auto" onClick={toggleTheme}>
      {theme === "light" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}
