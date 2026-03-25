import { createFileRoute } from "@tanstack/react-router";
import { BotCreationView } from "@/features/bot/ui/bot-creation-view";

export const Route = createFileRoute("/(protected)/_layout/bots/create")({
  component: BotCreationView,
  staticData: {
    hideSidebar: true,
    hideMobileNav: true,
  },
});
