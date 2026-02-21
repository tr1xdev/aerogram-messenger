import { Outlet } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-end p-4">
        <ThemeToggle />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
