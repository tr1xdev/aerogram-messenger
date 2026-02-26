import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient } from "@tanstack/react-query";
import { useThemeStore } from "./store/theme";
import { useEffect } from "react";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient },
});

export default function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  return <RouterProvider router={router} />;
}
