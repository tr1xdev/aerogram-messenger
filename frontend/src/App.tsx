import { RouterProvider } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "@/app/router";
import { useThemeStore } from "./store/theme";
import { useEffect } from "react";

export default function App() {
  const queryClient = useQueryClient();
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  return (
    <>
      <RouterProvider router={router} context={{ queryClient }} />
    </>
  );
}
