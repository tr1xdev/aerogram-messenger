import { createFileRoute } from "@tanstack/react-router";
import { BotListView } from "@/features/bot/ui/bot-list-view";

export const Route = createFileRoute("/(protected)/_layout/bots/")({
  component: BotListView,
  staticData: {
    hideSidebar: true,
    hideMobileNav: true,
  },
});
